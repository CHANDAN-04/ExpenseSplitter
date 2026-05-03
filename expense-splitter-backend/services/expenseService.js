const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");
const { generateExpenseId } = require("../utils/publicId");

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const normalizeParticipants = (participants = []) =>
  participants.map((participant) => ({
    userId: String(participant.userId || "").trim(),
    share: Number(participant.share),
    paid: Boolean(participant.paid),
  }));

const sanitizeExpense = (expense) => ({
  expenseId: expense.expenseId,
  title: expense.title,
  amount: expense.amount,
  paidBy: expense.paidBy,
  participants: (expense.participants || []).map((participant) => ({
    userId: participant.userId,
    share: participant.share,
    paid: participant.paid,
  })),
  groupId: expense.groupId,
  category: expense.category,
  billImageUrl: expense.billImageUrl,
  splitType: expense.splitType,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

const ensureUsersExist = async (userIds) => {
  const ids = Array.from(
    new Set((userIds || []).map((id) => String(id).trim()).filter(Boolean)),
  );
  const count = await User.countDocuments({ userId: { $in: ids } });
  return count === ids.length;
};

const validateCoreFields = async ({
  title,
  amount,
  paidBy,
  groupId,
  splitType,
  participants,
}) => {
  if (!title || amount === undefined || !paidBy || !groupId || !splitType) {
    throw new Error(
      "Title, amount, paidBy, groupId, and splitType are required",
    );
  }

  if (!["equal", "exact", "percentage"].includes(splitType)) {
    throw new Error("splitType must be equal, exact, or percentage");
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  const group = await Group.findOne({ groupId }).select("groupId members");
  if (!group) {
    throw new Error("Group not found");
  }

  if (!group.members.includes(String(paidBy))) {
    throw new Error("paidBy must be a group member");
  }

  const participantIds = participants.map((participant) =>
    String(participant.userId || "").trim(),
  );
  if (!participantIds.every((id) => group.members.includes(id))) {
    throw new Error("All participants must be group members");
  }

  const allUsersExist = await ensureUsersExist([paidBy, ...participantIds]);
  if (!allUsersExist) {
    throw new Error("One or more userIds are invalid");
  }
};

const buildEqualSplit = (participants, amount) => {
  const count = participants.length;
  const baseShare = roundToTwo(amount / count);
  const computed = participants.map((participant) => ({
    userId: participant.userId,
    share: baseShare,
    paid: participant.paid,
  }));

  const currentTotal = roundToTwo(
    computed.reduce((sum, participant) => sum + participant.share, 0),
  );
  const remainder = roundToTwo(amount - currentTotal);

  if (remainder !== 0) {
    computed[computed.length - 1].share = roundToTwo(
      computed[computed.length - 1].share + remainder,
    );
  }

  return computed;
};

const buildExactSplit = (participants, amount) => {
  const totalShare = roundToTwo(
    participants.reduce((sum, participant) => sum + participant.share, 0),
  );

  if (totalShare !== roundToTwo(amount)) {
    throw new Error("For exact split, participant shares must equal amount");
  }

  return participants;
};

const buildPercentageSplit = (participants, amount) => {
  const totalPercentage = roundToTwo(
    participants.reduce((sum, participant) => sum + participant.share, 0),
  );

  if (totalPercentage !== 100) {
    throw new Error("For percentage split, participant shares must total 100");
  }

  const computed = participants.map((participant) => ({
    userId: participant.userId,
    share: roundToTwo((amount * participant.share) / 100),
    paid: participant.paid,
  }));

  const currentTotal = roundToTwo(
    computed.reduce((sum, participant) => sum + participant.share, 0),
  );
  const remainder = roundToTwo(amount - currentTotal);

  if (remainder !== 0) {
    computed[computed.length - 1].share = roundToTwo(
      computed[computed.length - 1].share + remainder,
    );
  }

  return computed;
};

const calculateParticipants = (splitType, participants, amount) => {
  const normalized = normalizeParticipants(participants);

  if (!normalized.every((participant) => participant.userId)) {
    throw new Error("participants.userId is required");
  }

  if (splitType === "equal") {
    return buildEqualSplit(normalized, amount);
  }

  if (splitType === "exact") {
    return buildExactSplit(normalized, amount);
  }

  return buildPercentageSplit(normalized, amount);
};

const createUniqueExpenseId = async () => {
  let expenseId = "";
  let exists = true;

  while (exists) {
    expenseId = generateExpenseId();
    exists = await Expense.exists({ expenseId });
  }

  return expenseId;
};

const addExpense = async (payload) => {
  await validateCoreFields(payload);

  const amount = Number(payload.amount);
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const computedParticipants = calculateParticipants(
    payload.splitType,
    payload.participants,
    amount,
  );

  const expense = await Expense.create({
    expenseId: await createUniqueExpenseId(),
    title: payload.title.trim(),
    amount,
    paidBy: String(payload.paidBy).trim(),
    participants: computedParticipants,
    groupId: String(payload.groupId).trim(),
    category: payload.category || "General",
    billImageUrl: payload.billImageUrl || undefined,
    splitType: payload.splitType,
  });

  return sanitizeExpense(expense);
};

const getExpensesByGroup = async (groupId) => {
  const expenses = await Expense.find({
    groupId: String(groupId).trim(),
    isDeleted: false,
  }).sort({ createdAt: -1 });
  return expenses.map(sanitizeExpense);
};

const updateExpense = async (expenseId, payload) => {
  const existingExpense = await Expense.findOne({
    expenseId: String(expenseId).trim(),
  });
  if (!existingExpense) {
    throw new Error("Expense not found");
  }

  const splitType = payload.splitType || existingExpense.splitType;
  const amount =
    payload.amount !== undefined
      ? Number(payload.amount)
      : existingExpense.amount;
  const participants = payload.participants || existingExpense.participants;

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const validationPayload = {
    title: payload.title !== undefined ? payload.title : existingExpense.title,
    amount,
    paidBy: payload.paidBy || existingExpense.paidBy,
    groupId: payload.groupId || existingExpense.groupId,
    splitType,
    participants,
  };

  await validateCoreFields(validationPayload);
  const computedParticipants = calculateParticipants(
    splitType,
    participants,
    amount,
  );

  existingExpense.title =
    payload.title !== undefined ? payload.title.trim() : existingExpense.title;
  existingExpense.amount = amount;
  existingExpense.paidBy = payload.paidBy || existingExpense.paidBy;
  existingExpense.participants = computedParticipants;
  existingExpense.groupId = payload.groupId || existingExpense.groupId;
  existingExpense.category =
    payload.category !== undefined
      ? payload.category
      : existingExpense.category;
  existingExpense.billImageUrl =
    payload.billImageUrl !== undefined
      ? payload.billImageUrl
      : existingExpense.billImageUrl;
  existingExpense.splitType = splitType;

  await existingExpense.save();

  return sanitizeExpense(existingExpense);
};

module.exports = {
  addExpense,
  getExpensesByGroup,
  updateExpense,
};

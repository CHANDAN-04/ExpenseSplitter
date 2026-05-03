const expenseService = require("../services/expenseService");
const balanceService = require("../services/balanceService");
const { getIo } = require("../services/socket");
const { uploadImageBuffer } = require("../utils/cloudinary");
const { sanitizeExpense } = require("../utils/formatters");
const Expense = require("../models/Expense");
const Group = require("../models/Group");
const User = require("../models/User");

const parseValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const normalizeExpensePayload = (body) => ({
  ...body,
  amount: body.amount !== undefined ? Number(body.amount) : body.amount,
  participants: parseValue(body.participants),
  paidBy: parseValue(body.paidBy),
  splitType: parseValue(body.splitType),
  groupId: parseValue(body.groupId),
  category: parseValue(body.category),
  title: parseValue(body.title),
});

const attachBillImageIfProvided = async (req, payload) => {
  if (!req.file) {
    return payload;
  }

  const uploadResult = await uploadImageBuffer(req.file.buffer);
  return {
    ...payload,
    billImageUrl: uploadResult.secure_url,
  };
};

const emitGroupBalanceEvents = async (groupId, expenseEventName, expense) => {
  const io = getIo();
  const groupRoom = `group:${groupId}`;
  const balances = await balanceService.calculateGroupBalances(groupId);

  io.to(groupRoom).emit(expenseEventName, { expense });
  io.to(groupRoom).emit("balances:updated", {
    groupId,
    ...balances,
  });
  io.to(groupRoom).emit("settlement:updated", {
    groupId,
    transactions: balances.transactions,
  });
};

const addExpense = async (req, res, next) => {
  try {
    const normalizedPayload = normalizeExpensePayload(req.body);
    const payloadWithImage = await attachBillImageIfProvided(
      req,
      normalizedPayload,
    );
    const expense = await expenseService.addExpense(payloadWithImage);

    await emitGroupBalanceEvents(expense.groupId, "expense:created", expense);

    res.status(201).json({
      success: true,
      data: sanitizeExpense(expense),
      message: "Expense created successfully",
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const getSingleExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findOne({
      expenseId: String(expenseId).trim(),
    });

    if (!expense || expense.isDeleted) {
      res.status(404);
      throw new Error("Expense not found");
    }

    // Verify user belongs to group
    const group = await Group.findOne({ groupId: expense.groupId });
    if (!group || !group.members.includes(req.user.userId)) {
      res.status(403);
      throw new Error("Not authorized to view this expense");
    }

    res.status(200).json({
      success: true,
      data: sanitizeExpense(expense),
      message: "Expense retrieved successfully",
    });
  } catch (error) {
    if (error.message.includes("Not authorized")) {
      res.status(403);
    } else if (error.message === "Expense not found") {
      res.status(404);
    } else {
      res.status(400);
    }
    next(error);
  }
};

const getExpensesByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { category, fromDate, toDate, limit = 100, skip = 0 } = req.query;

    // Verify user belongs to group
    const group = await Group.findOne({ groupId: String(groupId).trim() });
    const uid = String(req.user.userId);
    if (
      !group ||
      !(group.members || []).map(String).includes(uid)
    ) {
      res.status(403);
      throw new Error("Not authorized to view group expenses");
    }

    const query = { groupId: String(groupId).trim(), isDeleted: false };

    if (category && category.trim()) {
      query.category = String(category).trim();
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Expense.countDocuments(query);

    const sanitizedList = expenses.map(sanitizeExpense);
    const payerIds = [
      ...new Set(sanitizedList.map((e) => String(e.paidBy))),
    ].filter(Boolean);
    const payers =
      payerIds.length > 0
        ? await User.find({ userId: { $in: payerIds } }).select(
            "userId username name",
          )
        : [];
    const payerById = Object.fromEntries(
      payers.map((u) => [String(u.userId), u]),
    );

    const expensesWithLabels = sanitizedList.map((e) => {
      const p = payerById[String(e.paidBy)];
      const label =
        p?.name || p?.username
          ? [p.name, p.username ? `@${p.username}` : null]
              .filter(Boolean)
              .join(" · ")
          : null;
      return {
        ...e,
        paidByUsername: p?.username || null,
        paidByName: p?.name || null,
        paidByDisplay: label || "Member",
      };
    });

    res.status(200).json({
      success: true,
      data: {
        expenses: expensesWithLabels,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      },
      message: "Expenses retrieved successfully",
    });
  } catch (error) {
    if (error.message.includes("Not authorized")) {
      res.status(403);
    } else {
      res.status(400);
    }
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const normalizedPayload = normalizeExpensePayload(req.body);
    const payloadWithImage = await attachBillImageIfProvided(
      req,
      normalizedPayload,
    );
    const expense = await expenseService.updateExpense(
      req.params.expenseId,
      payloadWithImage,
    );

    await emitGroupBalanceEvents(expense.groupId, "expense:updated", expense);

    res.status(200).json({
      success: true,
      data: sanitizeExpense(expense),
      message: "Expense updated successfully",
    });
  } catch (error) {
    if (error.message === "Expense not found") {
      res.status(404);
    } else {
      res.status(400);
    }
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findOne({
      expenseId: String(expenseId).trim(),
    });

    if (!expense || expense.isDeleted) {
      res.status(404);
      throw new Error("Expense not found");
    }

    // Verify user belongs to group
    const group = await Group.findOne({ groupId: expense.groupId });
    if (!group || !group.members.includes(req.user.userId)) {
      res.status(403);
      throw new Error("Not authorized to delete this expense");
    }

    expense.isDeleted = true;
    await expense.save();

    await emitGroupBalanceEvents(expense.groupId, "expense:deleted", expense);

    res.status(200).json({
      success: true,
      data: { expenseId: expense.expenseId },
      message: "Expense deleted successfully",
    });
  } catch (error) {
    if (error.message.includes("Not authorized")) {
      res.status(403);
    } else if (error.message === "Expense not found") {
      res.status(404);
    } else {
      res.status(400);
    }
    next(error);
  }
};

module.exports = {
  addExpense,
  getSingleExpense,
  getExpensesByGroup,
  updateExpense,
  deleteExpense,
};

// NEW: Calculate expense split for distribution
const calculateExpenseSplit = async (req, res, next) => {
  try {
    const { amount, splitType, participants } = req.body;

    if (!amount || !splitType || !participants || participants.length === 0) {
      res.status(400);
      throw new Error("amount, splitType, and participants array are required");
    }

    if (Number(amount) <= 0) {
      res.status(400);
      throw new Error("Amount must be positive");
    }

    let distribution = [];

    if (splitType === "equal") {
      // Equal split
      const splitAmount = Number(amount) / participants.length;
      distribution = participants.map((user) => ({
        userId: user.userId || user,
        share: Math.round(splitAmount * 100) / 100,
      }));
    } else if (splitType === "exact") {
      // Exact amounts provided
      if (!participants.every((p) => p.share !== undefined)) {
        res.status(400);
        throw new Error("Each participant must have a share for exact split");
      }

      const totalShares = participants.reduce(
        (sum, p) => sum + Number(p.share),
        0,
      );
      if (Math.abs(totalShares - Number(amount)) > 0.01) {
        res.status(400);
        throw new Error(
          `Total shares (${totalShares}) must equal amount (${amount})`,
        );
      }

      distribution = participants.map((p) => ({
        userId: p.userId || p,
        share: Number(p.share),
      }));
    } else if (splitType === "percentage") {
      // Percentage split
      if (!participants.every((p) => p.percentage !== undefined)) {
        res.status(400);
        throw new Error(
          "Each participant must have a percentage for percentage split",
        );
      }

      const totalPercentage = participants.reduce(
        (sum, p) => sum + Number(p.percentage),
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        res.status(400);
        throw new Error(
          `Total percentages must equal 100%, got ${totalPercentage}%`,
        );
      }

      distribution = participants.map((p) => ({
        userId: p.userId || p,
        share:
          Math.round(((Number(amount) * Number(p.percentage)) / 100) * 100) /
          100,
      }));
    } else {
      res.status(400);
      throw new Error(
        'Invalid splitType. Must be "equal", "exact", or "percentage"',
      );
    }

    res.status(200).json({
      success: true,
      data: {
        amount: Number(amount),
        splitType,
        distribution,
        total: distribution.reduce((sum, d) => sum + d.share, 0),
      },
      message: "Expense split calculated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get expense distribution report for a group
const getExpenseDistributionReport = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const Group = require("../models/Group");

    const group = await Group.findOne({ groupId });
    if (!group || !group.members.includes(req.user.userId)) {
      res.status(403);
      throw new Error("Not authorized to view group reports");
    }

    // Get all expenses for the group
    const expenses = await Expense.find({
      groupId,
      isDeleted: false,
    });

    let distribution = {};

    // Initialize distribution for all members
    group.members.forEach((memberId) => {
      distribution[memberId] = {
        userId: memberId,
        paidAmount: 0,
        owedAmount: 0,
        balanceAmount: 0,
      };
    });

    // Calculate distribution
    for (const expense of expenses) {
      const payer = String(expense.paidBy);

      if (distribution[payer]) {
        distribution[payer].paidAmount += Number(expense.amount);
      }

      for (const participant of expense.participants || []) {
        const userId = String(participant.userId);
        if (distribution[userId]) {
          distribution[userId].owedAmount += Number(participant.share || 0);
        }
      }
    }

    // Calculate net balance
    Object.keys(distribution).forEach((userId) => {
      distribution[userId].balanceAmount =
        distribution[userId].paidAmount - distribution[userId].owedAmount;
    });

    res.status(200).json({
      success: true,
      data: {
        groupId,
        distribution: Object.values(distribution),
        totalExpenseAmount: expenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        ),
      },
      message: "Expense distribution report generated",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get who owes whom in a group
const getExpenseSettlementPlan = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const Group = require("../models/Group");
    const balances = await balanceService.calculateGroupBalances(groupId);

    const group = await Group.findOne({ groupId });
    if (!group || !group.members.includes(req.user.userId)) {
      res.status(403);
      throw new Error("Not authorized to view group settlement plan");
    }

    res.status(200).json({
      success: true,
      data: {
        groupId,
        transactions: balances.transactions || [],
        summary: {
          totalBalance: balances.totalBalance,
          openTransactions: (balances.transactions || []).filter(
            (t) => Number(t.amount) > 0,
          ).length,
        },
      },
      message: "Settlement plan retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addExpense,
  getSingleExpense,
  getExpensesByGroup,
  updateExpense,
  deleteExpense,
  calculateExpenseSplit,
  getExpenseDistributionReport,
  getExpenseSettlementPlan,
};

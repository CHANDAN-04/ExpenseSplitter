const mongoose = require("mongoose");
const balanceService = require("./balanceService");
const SettlementRequest = require("../models/SettlementRequest");
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const User = require("../models/User");
const { generateSettlementRequestId, generateSettlementId } = require("../utils/publicId");

const roundToTwo = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const EMIT = {
  SENT: "settlement:request_sent",
  APPROVED: "settlement:request_approved",
  REJECTED: "settlement:request_rejected",
  CANCELLED: "settlement:request_cancelled",
};

function emitToUsersAndGroup(event, userIds, payload) {
  try {
    const { getIo } = require("./socket");
    const io = getIo();
    const ids = [...new Set(userIds.filter(Boolean))];
    for (const uid of ids) {
      io.to(`user:${uid}`).emit(event, payload);
    }
    if (payload.groupId) {
      io.to(`group:${payload.groupId}`).emit(event, payload);
    }
  } catch {
    /* socket optional in tests */
  }
}

async function createUniqueRequestId() {
  let id = generateSettlementRequestId();
  let exists = await SettlementRequest.exists({ settlementId: id });
  while (exists) {
    id = generateSettlementRequestId();
    exists = await SettlementRequest.exists({ settlementId: id });
  }
  return id;
}

async function createUniqueLedgerSettlementId() {
  let id = generateSettlementId();
  let exists = await Settlement.exists({ settlementId: id });
  while (exists) {
    id = generateSettlementId();
    exists = await Settlement.exists({ settlementId: id });
  }
  return id;
}

async function getDirectedOwingAmount(groupId, debtorId, creditorId) {
  const { transactions } = await balanceService.calculateGroupBalances(groupId);
  let sum = 0;
  for (const tx of transactions || []) {
    const fromId = String(tx.fromUser ?? tx.fromUserId ?? "");
    const toId = String(tx.toUser ?? tx.toUserId ?? "");
    if (fromId === String(debtorId) && toId === String(creditorId)) {
      sum += Number(tx.amount || 0);
    }
  }
  return roundToTwo(sum);
}

async function assertGroupMembership(groupId, ...userIds) {
  const group = await Group.findOne({ groupId: String(groupId).trim() }).select(
    "members groupId isDeleted",
  );
  if (!group || group.isDeleted) {
    const err = new Error("Group not found");
    err.statusCode = 404;
    throw err;
  }
  const members = new Set((group.members || []).map(String));
  for (const uid of userIds) {
    if (!members.has(String(uid))) {
      const err = new Error("User is not a member of this group");
      err.statusCode = 403;
      throw err;
    }
  }
  return group;
}

async function enrichRequests(requests) {
  const ids = new Set();
  for (const r of requests) {
    ids.add(r.fromUserId);
    ids.add(r.toUserId);
  }
  const users = await User.find({ userId: { $in: [...ids] } })
    .select("userId username name upiId")
    .lean();
  const map = new Map(users.map((u) => [u.userId, u]));
  return requests.map((r) => {
    const o =
      typeof r.toObject === "function" ? r.toObject() : { ...r };
    return {
      ...o,
      fromUser: map.get(o.fromUserId) || null,
      toUser: map.get(o.toUserId) || null,
    };
  });
}

/**
 * POST /settlements/request
 */
async function createRequest({
  groupId,
  fromUserId,
  toUserId,
  amount,
  type,
  note,
  paymentMode = "manual",
}) {
  const gid = String(groupId).trim();
  const fromId = String(fromUserId).trim();
  const toId = String(toUserId).trim();

  if (fromId === toId) {
    const err = new Error("Cannot request settlement with yourself");
    err.statusCode = 400;
    throw err;
  }

  await assertGroupMembership(gid, fromId, toId);

  const mode = paymentMode === "upi" ? "upi" : "manual";
  if (mode === "upi") {
    const creditor = await User.findOne({ userId: toId })
      .select("upiId")
      .lean();
    if (!creditor?.upiId || !String(creditor.upiId).trim()) {
      const err = new Error(
        "Receiver has no UPI ID — they must add it in profile settings",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const outstanding = await getDirectedOwingAmount(gid, fromId, toId);
  if (outstanding <= 0) {
    const err = new Error("No outstanding balance in this direction");
    err.statusCode = 400;
    throw err;
  }

  const amt = roundToTwo(Number(amount));
  if (amt <= 0 || amt > outstanding) {
    const err = new Error(
      `Amount must be positive and no more than owed (₹${outstanding.toFixed(2)})`,
    );
    err.statusCode = 400;
    throw err;
  }

  if (type === "full") {
    if (Math.abs(amt - outstanding) > 0.02) {
      const err = new Error(
        `Full settlement must equal full owed amount (₹${outstanding.toFixed(2)})`,
      );
      err.statusCode = 400;
      throw err;
    }
  } else if (type === "partial") {
    if (amt >= outstanding - 0.01) {
      const err = new Error(
        "Use type \"full\" when settling the full outstanding amount",
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const dup = await SettlementRequest.findOne({
    groupId: gid,
    fromUserId: fromId,
    toUserId: toId,
    status: "pending",
  });
  if (dup) {
    const err = new Error(
      "You already have a pending settlement request with this person",
    );
    err.statusCode = 409;
    throw err;
  }

  const settlementId = await createUniqueRequestId();
  const docPayload = {
    settlementId,
    groupId: gid,
    fromUserId: fromId,
    toUserId: toId,
    amount: amt,
    type,
    note: note || undefined,
    status: "pending",
    paymentMode: mode,
  };
  if (mode === "upi") {
    docPayload.paymentStatus = "pending_confirmation";
  }
  const doc = await SettlementRequest.create(docPayload);

  emitToUsersAndGroup(EMIT.SENT, [fromId, toId], {
    settlementId: doc.settlementId,
    groupId: gid,
    fromUserId: fromId,
    toUserId: toId,
    amount: amt,
    type,
    status: doc.status,
  });

  const [enriched] = await enrichRequests([doc]);
  return enriched;
}

/**
 * GET /settlements — optional ?groupId=
 */
async function listForUser(userId, groupIdFilter) {
  const uid = String(userId).trim();
  const q = groupIdFilter ? { groupId: String(groupIdFilter).trim() } : {};

  const incoming = await SettlementRequest.find({
    ...q,
    toUserId: uid,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  const outgoing = await SettlementRequest.find({
    ...q,
    fromUserId: uid,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    incomingRequests: await enrichRequests(incoming),
    outgoingRequests: await enrichRequests(outgoing),
  };
}

/**
 * GET /settlements/history?groupId=
 */
async function historyForUser(userId, groupId) {
  const uid = String(userId).trim();
  const gid = String(groupId || "").trim();
  if (!gid) {
    const err = new Error("groupId query is required");
    err.statusCode = 400;
    throw err;
  }

  await assertGroupMembership(gid, uid);

  const rows = await SettlementRequest.find({
    groupId: gid,
    status: { $in: ["approved", "rejected", "cancelled"] },
    $or: [{ fromUserId: uid }, { toUserId: uid }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  return enrichRequests(rows);
}

/**
 * PATCH respond
 */
async function respondToRequest({ settlementId, actorUserId, action }) {
  const uid = String(actorUserId).trim();
  const reqDoc = await SettlementRequest.findOne({
    settlementId: String(settlementId).trim(),
  });

  if (!reqDoc) {
    const err = new Error("Settlement request not found");
    err.statusCode = 404;
    throw err;
  }

  if (reqDoc.status !== "pending") {
    const err = new Error("This request is no longer pending");
    err.statusCode = 400;
    throw err;
  }

  if (String(reqDoc.toUserId) !== uid) {
    const err = new Error("Only the creditor can approve or reject");
    err.statusCode = 403;
    throw err;
  }

  if (action === "reject") {
    reqDoc.status = "rejected";
    if (reqDoc.paymentMode === "upi") {
      reqDoc.paymentStatus = "rejected";
    }
    await reqDoc.save();

    emitToUsersAndGroup(EMIT.REJECTED, [reqDoc.fromUserId, reqDoc.toUserId], {
      settlementId: reqDoc.settlementId,
      groupId: reqDoc.groupId,
      fromUserId: reqDoc.fromUserId,
      toUserId: reqDoc.toUserId,
      status: reqDoc.status,
    });

    const [enriched] = await enrichRequests([reqDoc]);
    return enriched;
  }

  if (action !== "approve") {
    const err = new Error('action must be "approve" or "reject"');
    err.statusCode = 400;
    throw err;
  }

  const outstanding = await getDirectedOwingAmount(
    reqDoc.groupId,
    reqDoc.fromUserId,
    reqDoc.toUserId,
  );

  if (reqDoc.amount > outstanding + 0.02) {
    const err = new Error(
      "Outstanding balance changed; reject this request and submit a new one",
    );
    err.statusCode = 409;
    throw err;
  }

  const session = await mongoose.startSession();
  let ledgerId;
  await session.withTransaction(async () => {
    ledgerId = await createUniqueLedgerSettlementId();
    const razorpayOrderId = `MANUAL_${ledgerId}`;

    await Settlement.create(
      [
        {
          settlementId: ledgerId,
          groupId: reqDoc.groupId,
          fromUser: reqDoc.fromUserId,
          toUser: reqDoc.toUserId,
          amount: roundToTwo(reqDoc.amount),
          status: "paid",
          currency: "INR",
          razorpayOrderId,
          verifiedAt: new Date(),
        },
      ],
      { session },
    );

    reqDoc.status = "approved";
    reqDoc.ledgerSettlementId = ledgerId;
    if (reqDoc.paymentMode === "upi") {
      reqDoc.paymentStatus = "confirmed";
    }
    await reqDoc.save({ session });
  });

  emitToUsersAndGroup(EMIT.APPROVED, [reqDoc.fromUserId, reqDoc.toUserId], {
    settlementId: reqDoc.settlementId,
    groupId: reqDoc.groupId,
    ledgerSettlementId: ledgerId,
    fromUserId: reqDoc.fromUserId,
    toUserId: reqDoc.toUserId,
    amount: reqDoc.amount,
    status: reqDoc.status,
  });

  const [enriched] = await enrichRequests([reqDoc]);
  return enriched;
}

/**
 * DELETE cancel (sender only, pending)
 */
async function cancelRequest({ settlementId, actorUserId }) {
  const uid = String(actorUserId).trim();
  const reqDoc = await SettlementRequest.findOne({
    settlementId: String(settlementId).trim(),
  });

  if (!reqDoc) {
    const err = new Error("Settlement request not found");
    err.statusCode = 404;
    throw err;
  }

  if (reqDoc.status !== "pending") {
    const err = new Error("Only pending requests can be cancelled");
    err.statusCode = 400;
    throw err;
  }

  if (String(reqDoc.fromUserId) !== uid) {
    const err = new Error("Only the requester can cancel");
    err.statusCode = 403;
    throw err;
  }

  reqDoc.status = "cancelled";
  await reqDoc.save();

  emitToUsersAndGroup(EMIT.CANCELLED, [reqDoc.fromUserId, reqDoc.toUserId], {
    settlementId: reqDoc.settlementId,
    groupId: reqDoc.groupId,
    fromUserId: reqDoc.fromUserId,
    toUserId: reqDoc.toUserId,
    status: "cancelled",
  });

  const [enriched] = await enrichRequests([reqDoc]);
  return enriched;
}

module.exports = {
  createRequest,
  listForUser,
  historyForUser,
  respondToRequest,
  cancelRequest,
  getDirectedOwingAmount,
};

const balanceService = require("../services/balanceService");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const User = require("../models/User");

const getGroupBalances = async (req, res, next) => {
  try {
    const balances = await balanceService.calculateGroupBalances(
      req.params.groupId,
    );
    res.status(200).json({
      success: true,
      data: { groupId: req.params.groupId, ...balances },
      message: "Group balances calculated",
    });
  } catch (error) {
    next(error);
  }
};

const getUserBalances = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get all expenses where user is either payer or participant
    const expenses = await Expense.find({
      $or: [{ paidBy: userId }, { "participants.userId": userId }],
      isDeleted: false,
    }).select("amount paidBy participants.userId participants.share");

    // Get all settled payments
    const settlements = await Settlement.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
      status: "paid",
    }).select("fromUser toUser amount");

    let totalOwed = 0;
    let totalToReceive = 0;

    // Calculate total owed and to receive
    for (const expense of expenses) {
      if (String(expense.paidBy) === String(userId)) {
        // User paid - they should receive
        for (const participant of expense.participants || []) {
          totalToReceive += Number(participant.share || 0);
        }
      } else {
        // User is participant - they owe
        for (const participant of expense.participants || []) {
          if (String(participant.userId) === String(userId)) {
            totalOwed += Number(participant.share || 0);
          }
        }
      }
    }

    // Adjust for settlements
    for (const settlement of settlements) {
      if (String(settlement.fromUser) === String(userId)) {
        totalOwed -= Number(settlement.amount || 0);
      } else if (String(settlement.toUser) === String(userId)) {
        totalToReceive -= Number(settlement.amount || 0);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        userId,
        totalOwed: Math.max(0, totalOwed),
        totalToReceive: Math.max(0, totalToReceive),
        netBalance: totalToReceive - totalOwed,
      },
      message: "User balances calculated",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get group balance between two users
const getBalanceBetweenUsers = async (req, res, next) => {
  try {
    const { groupId, userId1, userId2 } = req.query;

    if (!groupId || !userId1 || !userId2) {
      res.status(400);
      throw new Error("groupId, userId1, and userId2 are required");
    }

    // Get expenses between two users in the group
    const expenses = await Expense.find({
      groupId,
      isDeleted: false,
      $or: [
        { paidBy: userId1, "participants.userId": userId2 },
        { paidBy: userId2, "participants.userId": userId1 },
      ],
    });

    let user1OwedByUser2 = 0;
    let user2OwedByUser1 = 0;

    for (const expense of expenses) {
      if (String(expense.paidBy) === String(userId1)) {
        // User1 paid, User2 owes
        for (const participant of expense.participants || []) {
          if (String(participant.userId) === String(userId2)) {
            user2OwedByUser1 += Number(participant.share || 0);
          }
        }
      } else if (String(expense.paidBy) === String(userId2)) {
        // User2 paid, User1 owes
        for (const participant of expense.participants || []) {
          if (String(participant.userId) === String(userId1)) {
            user1OwedByUser2 += Number(participant.share || 0);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        groupId,
        userId1,
        userId2,
        user1OwedByUser2,
        user2OwedByUser1,
        netBalance: user2OwedByUser1 - user1OwedByUser2,
      },
      message: "Balance between users calculated",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Settle balance (create settlement record)
const settleBalance = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { groupId, toUserId, amount } = req.body;

    if (!groupId || !toUserId || !amount) {
      res.status(400);
      throw new Error("groupId, toUserId, and amount are required");
    }

    if (amount <= 0) {
      res.status(400);
      throw new Error("Amount must be positive");
    }

    if (String(userId) === String(toUserId)) {
      res.status(400);
      throw new Error("Cannot settle balance with yourself");
    }

    // Verify both users exist
    const userExists = await User.exists({ userId });
    const recipientExists = await User.exists({ userId: toUserId });

    if (!userExists || !recipientExists) {
      res.status(400);
      throw new Error("One or both users not found");
    }

    // Create settlement record
    const settlement = await Settlement.create({
      groupId,
      fromUser: userId,
      toUser: toUserId,
      amount,
      status: "paid",
    });

    res.status(201).json({
      success: true,
      data: settlement,
      message: "Balance settled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Get all settlements for user in a group
const getGroupSettlements = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const settlements = await Settlement.find({
      groupId,
      $or: [{ fromUser: userId }, { toUser: userId }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: settlements,
      message: "Settlements retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

// NEW: Clear all balances in a group (for admin to mark as settled)
const clearGroupBalance = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const Group = require("../models/Group");

    const group = await Group.findOne({ groupId });
    if (!group) {
      res.status(404);
      throw new Error("Group not found");
    }

    if (String(group.createdBy) !== String(req.user.userId)) {
      res.status(403);
      throw new Error("Only group admin can clear balances");
    }

    // Create settlement records for all pending debts (mark as settled)
    const expenses = await Expense.find({
      groupId,
      isDeleted: false,
    });

    const settlements = [];

    for (const expense of expenses) {
      for (const participant of expense.participants || []) {
        if (String(participant.userId) !== String(expense.paidBy)) {
          const settlement = await Settlement.create({
            groupId,
            fromUser: participant.userId,
            toUser: expense.paidBy,
            amount: participant.share,
            status: "paid",
          });
          settlements.push(settlement);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { settlementsCreated: settlements.length },
      message: "Group balance cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroupBalances,
  getUserBalances,
  getBalanceBetweenUsers,
  settleBalance,
  getGroupSettlements,
  clearGroupBalance,
};

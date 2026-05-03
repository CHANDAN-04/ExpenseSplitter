const Group = require("../models/Group");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const User = require("../models/User");
const balanceService = require("./balanceService");

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const toMonthKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getDashboardSummary = async (userId) => {
  const uid = String(userId).trim();

  const groups = await Group.find({ members: uid, isDeleted: false })
    .select("groupId name members createdBy joinRequests")
    .sort({ createdAt: -1 })
    .lean();

  const groupIds = groups.map((g) => g.groupId);
  const groupNameById = new Map(groups.map((g) => [g.groupId, g.name]));

  const allMemberIds = new Set();
  for (const group of groups) {
    for (const memberId of group.members || []) {
      if (String(memberId) !== uid) {
        allMemberIds.add(String(memberId));
      }
    }
  }

  const friendIds = Array.from(allMemberIds);
  const totalGroups = groups.length;
  const totalFriends = friendIds.length;

  const recentExpenseDocs = groupIds.length
    ? await Expense.find({ groupId: { $in: groupIds }, isDeleted: false })
        .select(
          "expenseId title amount paidBy groupId createdAt participants",
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    : [];

  const allUserIdsForLookup = new Set(friendIds);
  allUserIdsForLookup.add(uid);
  for (const expense of recentExpenseDocs) {
    allUserIdsForLookup.add(String(expense.paidBy));
  }

  const users = await User.find({
    userId: { $in: Array.from(allUserIdsForLookup) },
  })
    .select("userId username email name -_id")
    .lean();

  const userById = new Map(users.map((u) => [u.userId, u]));

  const recentActivities = recentExpenseDocs.map((expense) => {
    const payer = userById.get(String(expense.paidBy));
    return {
      expenseId: expense.expenseId,
      title: expense.title,
      amount: expense.amount,
      paidBy: {
        userId: String(expense.paidBy),
        username: payer?.username || null,
        name: payer?.name || null,
      },
      group: {
        groupId: expense.groupId,
        name: groupNameById.get(expense.groupId) || null,
      },
      timestamp: expense.createdAt,
    };
  });

  let monthlySpending = [];
  let spendingByGroup = [];

  if (groupIds.length > 0) {
    const aggResult = await Expense.aggregate([
      { $match: { groupId: { $in: groupIds }, isDeleted: false } },
      { $unwind: "$participants" },
      {
        $match: {
          $expr: {
            $eq: [{ $toString: "$participants.userId" }, uid],
          },
        },
      },
      {
        $facet: {
          monthly: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m", date: "$createdAt" },
                },
                spent: { $sum: "$participants.share" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byGroup: [
            {
              $group: {
                _id: "$groupId",
                spent: { $sum: "$participants.share" },
              },
            },
            { $sort: { spent: -1 } },
          ],
        },
      },
    ]);

    const facet = aggResult[0] || { monthly: [], byGroup: [] };

    monthlySpending = (facet.monthly || []).map((r) => ({
      month: r._id,
      spent: roundToTwo(Number(r.spent || 0)),
    }));

    spendingByGroup = (facet.byGroup || []).map((r) => ({
      groupId: r._id,
      name: groupNameById.get(r._id) || "Group",
      spent: roundToTwo(Number(r.spent || 0)),
    }));
  }

  const currentMonthKey = toMonthKey(new Date());
  const spentThisMonth = roundToTwo(
    monthlySpending.find((m) => m.month === currentMonthKey)?.spent || 0,
  );

  let totalToReceive = 0;
  let totalToPay = 0;
  let pendingSettlementsCount = 0;
  const netWithFriend = new Map(friendIds.map((id) => [id, 0]));

  for (const gid of groupIds) {
    const balances = await balanceService.calculateGroupBalances(gid);
    for (const tx of balances.transactions || []) {
      const fromUser = String(tx.fromUser || tx.fromUserId || "");
      const toUser = String(tx.toUser || tx.toUserId || "");
      const amount = roundToTwo(Number(tx.amount || 0));

      if (!amount) {
        continue;
      }

      if (fromUser === uid || toUser === uid) {
        pendingSettlementsCount += 1;
      }

      if (fromUser === uid) {
        totalToPay = roundToTwo(totalToPay + amount);
        if (netWithFriend.has(toUser)) {
          netWithFriend.set(
            toUser,
            roundToTwo(netWithFriend.get(toUser) - amount),
          );
        }
      } else if (toUser === uid) {
        totalToReceive = roundToTwo(totalToReceive + amount);
        if (netWithFriend.has(fromUser)) {
          netWithFriend.set(
            fromUser,
            roundToTwo(netWithFriend.get(fromUser) + amount),
          );
        }
      }
    }
  }

  const friends = friendIds
    .map((id) => {
      const profile = userById.get(id);
      const net = roundToTwo(netWithFriend.get(id) || 0);
      const balanceText =
        net > 0
          ? `Owes you ₹${Math.abs(net)}`
          : net < 0
            ? `You owe ₹${Math.abs(net)}`
            : "No transactions yet";

      return {
        userId: id,
        username: profile?.username || null,
        name: profile?.name || null,
        displayName: profile?.name || profile?.username || "Member",
        email: profile?.email || null,
        netBalance: net,
        balanceText,
      };
    })
    .sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance))
    .slice(0, 5);

  const settlements = groupIds.length
    ? await Settlement.find({
        groupId: { $in: groupIds },
        status: "paid",
        $or: [{ fromUser: uid }, { toUser: uid }],
      })
        .select("groupId fromUser toUser amount createdAt")
        .lean()
    : [];

  const totalExpenses = groupIds.length
    ? await Expense.countDocuments({ groupId: { $in: groupIds }, isDeleted: false })
    : 0;
  const totalExpenseAmountAgg = groupIds.length
    ? await Expense.aggregate([
        { $match: { groupId: { $in: groupIds }, isDeleted: false } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
    : [];
  const totalExpenseAmount = roundToTwo(totalExpenseAmountAgg?.[0]?.total || 0);

  const totalYouSpentAllTime = roundToTwo(
    spendingByGroup.reduce((s, g) => s + g.spent, 0),
  );

  return {
    userId: uid,
    totals: {
      totalToReceive,
      totalToPay,
      netBalance: roundToTwo(totalToReceive - totalToPay),
      totalGroups,
      totalExpenses,
      totalExpenseAmount,
      totalFriends,
      pendingSettlementsCount,
    },
    friends,
    recentActivities,
    analytics: {
      spentThisMonth,
      monthlySpending,
      spendingByGroup,
      settlementsCount: settlements.length,
      totalYourShareAllTime: totalYouSpentAllTime,
    },
  };
};

module.exports = {
  getDashboardSummary,
};

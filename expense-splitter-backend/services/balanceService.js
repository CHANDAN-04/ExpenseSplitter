const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const toUserId = (value) => String(value);

const buildNetBalances = (expenses) => {
  const netByUser = new Map();

  for (const expense of expenses) {
    const payerId = toUserId(expense.paidBy);
    const currentPayerBalance = netByUser.get(payerId) || 0;
    netByUser.set(
      payerId,
      roundToTwo(currentPayerBalance + Number(expense.amount || 0)),
    );

    for (const participant of expense.participants || []) {
      const userId = toUserId(participant.userId);
      const currentUserBalance = netByUser.get(userId) || 0;
      netByUser.set(
        userId,
        roundToTwo(currentUserBalance - Number(participant.share || 0)),
      );
    }
  }

  return netByUser;
};

const applyPaidSettlements = (netByUser, settlements) => {
  for (const settlement of settlements) {
    const fromUser = toUserId(settlement.fromUser);
    const toUser = toUserId(settlement.toUser);
    const amount = roundToTwo(Number(settlement.amount || 0));

    if (amount <= 0) {
      continue;
    }

    const fromCurrent = netByUser.get(fromUser) || 0;
    const toCurrent = netByUser.get(toUser) || 0;

    netByUser.set(fromUser, roundToTwo(fromCurrent + amount));
    netByUser.set(toUser, roundToTwo(toCurrent - amount));
  }
};

const optimizeDebts = (netByUser) => {
  const creditors = [];
  const debtors = [];

  for (const [userId, netAmount] of netByUser.entries()) {
    const rounded = roundToTwo(netAmount);
    if (rounded > 0) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ userId, amount: roundToTwo(-rounded) });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const settledAmount = roundToTwo(Math.min(creditor.amount, debtor.amount));

    if (settledAmount > 0) {
      transactions.push({
        fromUser: debtor.userId,
        toUser: creditor.userId,
        amount: settledAmount,
      });
    }

    creditor.amount = roundToTwo(creditor.amount - settledAmount);
    debtor.amount = roundToTwo(debtor.amount - settledAmount);

    if (creditor.amount === 0) {
      creditorIndex += 1;
    }

    if (debtor.amount === 0) {
      debtorIndex += 1;
    }
  }

  return transactions;
};

const calculateBalancesFromExpenses = (expenses, settlements = []) => {
  const netByUser = buildNetBalances(expenses);
  applyPaidSettlements(netByUser, settlements);
  const transactions = optimizeDebts(netByUser);

  const balances = Array.from(netByUser.entries())
    .map(([userId, net]) => ({
      userId,
      net: roundToTwo(net),
    }))
    .filter((entry) => entry.net !== 0)
    .sort((a, b) => b.net - a.net);

  const owes = {};
  for (const tx of transactions) {
    if (!owes[tx.fromUser]) {
      owes[tx.fromUser] = [];
    }
    owes[tx.fromUser].push({ toUser: tx.toUser, amount: tx.amount });
  }

  return {
    balances,
    transactions,
    owes,
  };
};

const calculateGroupBalances = async (groupId) => {
  const normalizedGroupId = String(groupId).trim();
  const expenses = await Expense.find({
    groupId: normalizedGroupId,
    isDeleted: false,
  }).select("amount paidBy participants.userId participants.share");
  const settlements = await Settlement.find({
    groupId: normalizedGroupId,
    status: "paid",
  }).select("fromUser toUser amount");
  return calculateBalancesFromExpenses(expenses, settlements);
};

module.exports = {
  calculateBalancesFromExpenses,
  calculateGroupBalances,
};

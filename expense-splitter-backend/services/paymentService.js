const crypto = require('crypto');
const { getRazorpayClient } = require('../utils/razorpay');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const User = require('../models/User');
const { generateSettlementId } = require('../utils/publicId');

const createUniqueSettlementId = async () => {
  let settlementId = '';
  let exists = true;

  while (exists) {
    settlementId = generateSettlementId();
    exists = await Settlement.exists({ settlementId });
  }

  return settlementId;
};

const sanitizeSettlement = (settlement) => ({
  settlementId: settlement.settlementId,
  groupId: settlement.groupId,
  fromUser: settlement.fromUser,
  toUser: settlement.toUser,
  amount: settlement.amount,
  currency: settlement.currency,
  status: settlement.status,
  razorpayOrderId: settlement.razorpayOrderId,
  razorpayPaymentId: settlement.razorpayPaymentId,
  verifiedAt: settlement.verifiedAt,
  createdAt: settlement.createdAt,
  updatedAt: settlement.updatedAt
});

const createSettlementOrder = async ({ groupId, fromUser, toUser, amount, currency = 'INR' }) => {
  if (!groupId || !fromUser || !toUser || amount === undefined) {
    throw new Error('groupId, fromUser, toUser, and amount are required');
  }

  if (String(fromUser) === String(toUser)) {
    throw new Error('fromUser and toUser must be different');
  }

  const normalizedAmount = Number(amount);
  if (normalizedAmount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  const group = await Group.findOne({ groupId: String(groupId).trim() }).select('groupId members');
  if (!group) {
    throw new Error('Group not found');
  }

  if (!group.members.includes(String(fromUser)) || !group.members.includes(String(toUser))) {
    throw new Error('fromUser and toUser must be members of the group');
  }

  const userCount = await User.countDocuments({ userId: { $in: [String(fromUser), String(toUser)] } });
  if (userCount !== 2) {
    throw new Error('Invalid userId in settlement');
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: Math.round(normalizedAmount * 100),
    currency,
    receipt: `settle_${Date.now()}`,
    notes: {
      groupId: String(groupId),
      fromUser: String(fromUser),
      toUser: String(toUser)
    }
  });

  const settlement = await Settlement.create({
    settlementId: await createUniqueSettlementId(),
    groupId: String(groupId),
    fromUser: String(fromUser),
    toUser: String(toUser),
    amount: normalizedAmount,
    currency,
    razorpayOrderId: order.id,
    status: 'pending'
  });

  return {
    settlementId: settlement.settlementId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID
  };
};

const verifySettlementPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Payment verification payload is incomplete');
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const providedBuffer = Buffer.from(razorpay_signature, 'hex');

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error('Invalid payment signature');
  }

  const settlement = await Settlement.findOne({ razorpayOrderId: razorpay_order_id });
  if (!settlement) {
    throw new Error('Settlement not found for order');
  }

  settlement.razorpayPaymentId = razorpay_payment_id;
  settlement.razorpaySignature = razorpay_signature;
  settlement.status = 'paid';
  settlement.verifiedAt = new Date();

  await settlement.save();

  return sanitizeSettlement(settlement);
};

const getPaidSettlementsByGroup = async (groupId) => {
  const settlements = await Settlement.find({ groupId: String(groupId).trim(), status: 'paid' });
  return settlements.map(sanitizeSettlement);
};

const isValidUserId = (userId) => /^USR_[A-Z0-9]+$/.test(String(userId || '').trim());

module.exports = {
  createSettlementOrder,
  verifySettlementPayment,
  getPaidSettlementsByGroup,
  isValidUserId
};

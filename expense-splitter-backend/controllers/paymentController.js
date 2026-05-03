const paymentService = require("../services/paymentService");
const balanceService = require("../services/balanceService");
const { getIo } = require("../services/socket");

const createOrder = async (req, res, next) => {
  try {
    const { groupId, fromUser, toUser, amount, currency } = req.body;

    if (
      !paymentService.isValidUserId(fromUser) ||
      !paymentService.isValidUserId(toUser)
    ) {
      res.status(400);
      throw new Error("Invalid fromUser or toUser");
    }

    if (String(req.user.userId) !== String(fromUser)) {
      res.status(403);
      throw new Error("Not authorized to create this settlement payment");
    }

    const order = await paymentService.createSettlementOrder({
      groupId,
      fromUser,
      toUser,
      amount,
      currency,
    });

    res.status(201).json({
      success: true,
      data: order,
      message: "Order created successfully",
    });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const settlement = await paymentService.verifySettlementPayment(req.body);
    const balances = await balanceService.calculateGroupBalances(
      settlement.groupId,
    );
    const io = getIo();
    const groupRoom = `group:${settlement.groupId}`;

    io.to(groupRoom).emit("settlement:paid", settlement);
    io.to(groupRoom).emit("balances:updated", {
      groupId: settlement.groupId,
      ...balances,
    });
    io.to(groupRoom).emit("settlement:updated", {
      groupId: settlement.groupId,
      transactions: balances.transactions,
    });

    res.status(200).json({
      success: true,
      data: {
        message: "Payment verified successfully",
        settlementId: settlement.settlementId,
        groupId: settlement.groupId,
        status: settlement.status,
      },
      message: "Payment verified successfully",
    });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};

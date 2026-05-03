const settlementRequestService = require("../services/settlementRequestService");

exports.createRequest = async (req, res, next) => {
  try {
    const data = await settlementRequestService.createRequest({
      groupId: req.body.groupId,
      fromUserId: req.user.userId,
      toUserId: req.body.toUserId,
      amount: req.body.amount,
      type: req.body.type,
      note: req.body.note,
      paymentMode: req.body.paymentMode,
    });
    res.status(201).json({
      success: true,
      data,
      message: "Settlement request created",
    });
  } catch (error) {
    next(error);
  }
};

exports.listRequests = async (req, res, next) => {
  try {
    const data = await settlementRequestService.listForUser(
      req.user.userId,
      req.query.groupId,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Settlement requests retrieved",
    });
  } catch (error) {
    next(error);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const data = await settlementRequestService.historyForUser(
      req.user.userId,
      req.query.groupId,
    );
    res.status(200).json({
      success: true,
      data,
      message: "Settlement history retrieved",
    });
  } catch (error) {
    next(error);
  }
};

exports.respond = async (req, res, next) => {
  try {
    const data = await settlementRequestService.respondToRequest({
      settlementId: req.params.settlementId,
      actorUserId: req.user.userId,
      action: req.body.action,
    });
    res.status(200).json({
      success: true,
      data,
      message:
        req.body.action === "approve"
          ? "Settlement approved and recorded"
          : "Request rejected",
    });
  } catch (error) {
    next(error);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const data = await settlementRequestService.cancelRequest({
      settlementId: req.params.settlementId,
      actorUserId: req.user.userId,
    });
    res.status(200).json({
      success: true,
      data,
      message: "Settlement request cancelled",
    });
  } catch (error) {
    next(error);
  }
};

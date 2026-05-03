const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validation");
const settlementRequestController = require("../controllers/settlementRequestController");

const router = express.Router();

router.post(
  "/request",
  protect,
  validate("settlementRequest"),
  settlementRequestController.createRequest,
);
router.get("/history", protect, settlementRequestController.getHistory);
router.get("/", protect, settlementRequestController.listRequests);
router.patch(
  "/:settlementId/respond",
  protect,
  validate("settlementRespond"),
  settlementRequestController.respond,
);
router.delete("/:settlementId", protect, settlementRequestController.cancel);

module.exports = router;

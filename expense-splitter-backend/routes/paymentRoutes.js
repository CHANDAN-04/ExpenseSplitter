const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validation");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/order", protect, validate("createSettlement"), createOrder);
router.post("/verify", protect, verifyPayment);

module.exports = router;

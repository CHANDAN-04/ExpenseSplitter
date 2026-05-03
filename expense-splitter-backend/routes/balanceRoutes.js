const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getGroupBalances,
  getUserBalances,
  getBalanceBetweenUsers,
  settleBalance,
  getGroupSettlements,
  clearGroupBalance,
} = require("../controllers/balanceController");

const router = express.Router();

// Get balances
router.get("/:groupId", protect, getGroupBalances);
router.get("/user/summary", protect, getUserBalances);

// NEW: Balance between two users
router.get("/between/users", protect, getBalanceBetweenUsers);

// NEW: Settle balance
router.post("/settle", protect, settleBalance);

// NEW: Get settlements for a group
router.get("/:groupId/settlements", protect, getGroupSettlements);

// NEW: Clear all balances in a group (admin only)
router.post("/:groupId/clear", protect, clearGroupBalance);

module.exports = router;

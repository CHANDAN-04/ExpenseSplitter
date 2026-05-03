const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { uploadBillImage } = require("../middleware/upload");
const { validate } = require("../middleware/validation");
const {
  addExpense,
  getSingleExpense,
  getExpensesByGroup,
  updateExpense,
  deleteExpense,
  calculateExpenseSplit,
  getExpenseDistributionReport,
  getExpenseSettlementPlan,
} = require("../controllers/expenseController");

const router = express.Router();

// Create expense
router.post(
  "/",
  protect,
  validate("createExpense"),
  uploadBillImage,
  addExpense,
);

// Get expenses by group
router.get("/group/:groupId", protect, getExpensesByGroup);

// NEW: Get single expense
router.get("/:expenseId", protect, getSingleExpense);

// NEW: Calculate expense split
router.post("/split/calculate", protect, calculateExpenseSplit);

// NEW: Get distribution report for group
router.get(
  "/report/distribution/:groupId",
  protect,
  getExpenseDistributionReport,
);

// NEW: Get settlement plan for group
router.get("/report/settlement/:groupId", protect, getExpenseSettlementPlan);

// Update and delete
router.put("/:expenseId", protect, uploadBillImage, updateExpense);
router.delete("/:expenseId", protect, deleteExpense);

module.exports = router;

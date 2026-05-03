const express = require("express");
const { healthCheck } = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const expenseRoutes = require("./expenseRoutes");
const groupRoutes = require("./groupRoutes");
const paymentRoutes = require("./paymentRoutes");
const balanceRoutes = require("./balanceRoutes");
const notificationRoutes = require("./notificationRoutes");
const activityRoutes = require("./activityRoutes");
const dashboardRoutes = require("./dashboardRoutes");
const settlementRoutes = require("./settlementRoutes");

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/expenses", expenseRoutes);
router.use("/groups", groupRoutes);
router.use("/payments", paymentRoutes);
router.use("/balances", balanceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activities", activityRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settlements", settlementRoutes);

module.exports = router;

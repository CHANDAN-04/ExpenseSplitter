const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", protect, getUserNotifications);
router.put("/:notificationId/read", protect, markAsRead);
router.put("/mark-all-read", protect, markAllAsRead);
router.delete("/:notificationId", protect, deleteNotification);

module.exports = router;

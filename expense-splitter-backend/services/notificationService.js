const Notification = require("../models/Notification");
const { generateNotificationId } = require("../utils/publicId");
const logger = require("../utils/logger");
const { sanitizeNotification } = require("../utils/formatters");

const createNotification = async (
  userId,
  type,
  title,
  message,
  relatedData = {},
) => {
  try {
    const notificationId = generateNotificationId();

    const notification = await Notification.create({
      notificationId,
      userId: String(userId).trim(),
      type,
      title: title.trim(),
      message: message.trim(),
      relatedData,
    });

    return sanitizeNotification(notification);
  } catch (error) {
    logger.error("Error creating notification:", error);
    // Silently fail - notifications are non-critical
    return null;
  }
};

const getUserNotifications = async (userId, limit = 50, skip = 0) => {
  try {
    const notifications = await Notification.find({
      userId: String(userId).trim(),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return notifications.map(sanitizeNotification);
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return [];
  }
};

const markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { notificationId: String(notificationId).trim() },
      { read: true },
      { new: true },
    );
    return sanitizeNotification(notification);
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    return null;
  }
};

const markAllAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId: String(userId).trim(), read: false },
      { read: true },
    );
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
  }
};

const deleteNotification = async (notificationId) => {
  try {
    await Notification.findOneAndUpdate(
      { notificationId: String(notificationId).trim() },
      { isDeleted: true },
      { new: true },
    );
  } catch (error) {
    logger.error("Error deleting notification:", error);
  }
};

const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({
      userId: String(userId).trim(),
      read: false,
    });
  } catch (error) {
    logger.error("Error getting unread count:", error);
    return 0;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};

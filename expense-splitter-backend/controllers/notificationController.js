const notificationService = require("../services/notificationService");

const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, skip = 0 } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(skip),
    );

    const unreadCount = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      },
      message: "Notifications retrieved",
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId);

    if (!notification) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: "Notification marked as read",
    });
  } catch (error) {
    if (error.message === "Notification not found") {
      res.status(404);
    } else {
      res.status(400);
    }
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: {},
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    await notificationService.deleteNotification(notificationId);

    res.status(200).json({
      success: true,
      data: { notificationId },
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

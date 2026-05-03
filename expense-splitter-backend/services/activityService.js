const ActivityLog = require("../models/ActivityLog");
const { generateActivityId } = require("../utils/publicId");
const logger = require("../utils/logger");
const { sanitizeActivityLog } = require("../utils/formatters");

const createActivityLog = async (
  groupId,
  userId,
  type,
  description,
  relatedData = {},
) => {
  try {
    const activityId = generateActivityId();

    const activity = await ActivityLog.create({
      activityId,
      groupId: String(groupId).trim(),
      userId: String(userId).trim(),
      type,
      description: description.trim(),
      relatedData,
    });

    return sanitizeActivityLog(activity);
  } catch (error) {
    logger.error("Error creating activity log:", error);
    // Silently fail - activity logs are non-critical
    return null;
  }
};

const getGroupActivities = async (groupId, limit = 50, skip = 0) => {
  try {
    const activities = await ActivityLog.find({
      groupId: String(groupId).trim(),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return activities.map(sanitizeActivityLog);
  } catch (error) {
    logger.error("Error fetching activities:", error);
    return [];
  }
};

const deleteActivityLog = async (activityId) => {
  try {
    await ActivityLog.findOneAndUpdate(
      { activityId: String(activityId).trim() },
      { isDeleted: true },
      { new: true },
    );
  } catch (error) {
    logger.error("Error deleting activity log:", error);
  }
};

module.exports = {
  createActivityLog,
  getGroupActivities,
  deleteActivityLog,
};

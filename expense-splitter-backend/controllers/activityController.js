const activityService = require("../services/activityService");
const Group = require("../models/Group");

const getGroupActivities = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Verify user is member of group
    const group = await Group.findOne({ groupId: String(groupId).trim() });
    if (!group || !group.members.includes(req.user.userId)) {
      res.status(403);
      throw new Error("Not authorized to view group activities");
    }

    const activities = await activityService.getGroupActivities(
      groupId,
      parseInt(limit),
      parseInt(skip),
    );

    res.status(200).json({
      success: true,
      data: {
        activities,
        groupId,
        pagination: {
          limit: parseInt(limit),
          skip: parseInt(skip),
        },
      },
      message: "Activities retrieved",
    });
  } catch (error) {
    if (error.message.includes("Not authorized")) {
      res.status(403);
    } else {
      res.status(400);
    }
    next(error);
  }
};

module.exports = {
  getGroupActivities,
};

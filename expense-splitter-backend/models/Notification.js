const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "group_created",
        "group_member_added",
        "group_member_removed",
        "join_request",
        "join_approved",
        "join_rejected",
        "settlement_paid",
        "balance_updated",
        "friend_request",
        "friend_accepted",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedData: {
      groupId: String,
      expenseId: String,
      userId: String,
      settlementId: String,
      friendRequestId: String,
      fromUserId: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure active notifications for queries
notificationSchema.pre("find", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

notificationSchema.pre("findOne", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model("Notification", notificationSchema);

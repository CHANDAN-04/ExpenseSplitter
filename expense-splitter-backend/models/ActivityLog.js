const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    activityId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    groupId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "member_joined",
        "member_left",
        "member_removed",
        "settlement_paid",
        "group_updated",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    relatedData: {
      expenseId: String,
      memberId: String,
      settlementId: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
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

// Ensure active logs for queries
activityLogSchema.pre("find", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

activityLogSchema.pre("findOne", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);

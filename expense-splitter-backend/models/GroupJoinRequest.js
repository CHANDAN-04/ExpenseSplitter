const mongoose = require("mongoose");

const groupJoinRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    groupId: {
      type: String,
      required: true,
      index: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries - prevent duplicate requests
groupJoinRequestSchema.index({ userId: 1, groupId: 1 }, { unique: true });
groupJoinRequestSchema.index({ groupId: 1, status: 1 });
groupJoinRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("GroupJoinRequest", groupJoinRequestSchema);

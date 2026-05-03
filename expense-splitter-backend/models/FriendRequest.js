const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderUsername: {
      type: String,
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
friendRequestSchema.index({ senderId: 1, recipientId: 1 }, { unique: true });
friendRequestSchema.index({ recipientId: 1, status: 1 });
friendRequestSchema.index({ senderId: 1, status: 1 });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);

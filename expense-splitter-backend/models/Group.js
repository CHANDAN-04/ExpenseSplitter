const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const groupSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    members: {
      type: [String],
      default: [],
    },
    memberDetails: {
      type: [memberSchema],
      default: [],
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    joinRequests: {
      type: [String],
      default: [],
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

// Ensure active groups for queries
groupSchema.pre("find", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

groupSchema.pre("findOne", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model("Group", groupSchema);

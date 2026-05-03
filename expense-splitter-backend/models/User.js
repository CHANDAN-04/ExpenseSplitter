const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    // Globally unique — login identity & URLs (/@username). Cannot duplicate.
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_-]+$/,
    },
    // Display name only — duplicates allowed across users.
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    /** VPA for UPI deep links (e.g. name@upi) — optional */
    upiId: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    friends: {
      type: [String],
      default: [],
    },
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
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

// Ensure active users for search queries
userSchema.pre("find", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

userSchema.pre("findOne", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model("User", userSchema);

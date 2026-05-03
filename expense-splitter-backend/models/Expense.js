const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    share: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const expenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidBy: {
      type: String,
      required: true,
      trim: true,
    },
    participants: {
      type: [participantSchema],
      validate: [
        (value) => value.length > 0,
        "At least one participant is required",
      ],
    },
    groupId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    billImageUrl: {
      type: String,
      trim: true,
    },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage"],
      required: true,
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

// Ensure active expenses for queries
expenseSchema.pre("find", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

expenseSchema.pre("findOne", function () {
  if (!this.options.includeDeleted) {
    this.where({ isDeleted: false });
  }
});

module.exports = mongoose.model("Expense", expenseSchema);

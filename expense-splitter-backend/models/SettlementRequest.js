const mongoose = require("mongoose");

const settlementRequestSchema = new mongoose.Schema(
  {
    settlementId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    groupId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fromUserId: {
      type: String,
      required: true,
      trim: true,
    },
    toUserId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    type: {
      type: String,
      enum: ["full", "partial"],
      required: true,
    },
    note: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    /** Links to ledger row in Settlement when approved (manual record). */
    ledgerSettlementId: {
      type: String,
      trim: true,
    },
    /** manual = default request; upi = payer used UPI flow before "I have paid" */
    paymentMode: {
      type: String,
      enum: ["manual", "upi"],
      default: "manual",
    },
    /**
     * UPI / extended tracking. manual requests typically omit this until terminal.
     * UPI: pending_confirmation after debtor marks paid → confirmed/rejected on respond.
     */
    paymentStatus: {
      type: String,
      enum: ["initiated", "pending_confirmation", "confirmed", "rejected"],
    },
  },
  { timestamps: true },
);

settlementRequestSchema.index(
  { groupId: 1, fromUserId: 1, toUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  },
);

module.exports = mongoose.model("SettlementRequest", settlementRequestSchema);

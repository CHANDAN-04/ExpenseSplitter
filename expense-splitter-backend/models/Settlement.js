const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    settlementId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    groupId: {
      type: String,
      required: true,
      trim: true
    },
    fromUser: {
      type: String,
      required: true,
      trim: true
    },
    toUser: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    razorpayPaymentId: {
      type: String
    },
    razorpaySignature: {
      type: String
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Settlement', settlementSchema);

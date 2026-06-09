const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "SubscriptionPlan", 
    },
    durationInDays: {
      type: Number,
      required: true,
    },
    // Razorpay order ID returned from createOrder API (e.g. "order_xxxxx")
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    // Razorpay payment ID returned after successful payment (e.g. "pay_xxxxx")
    paymentId: {
      type: String,
      default: null,
    },
    // HMAC-SHA256 signature returned by Razorpay — used for server-side verification
    razorpay_signature: {
      type: String,
      default: null,
    },
    // Amount in paise (INR smallest unit). e.g. ₹499 → 49900
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
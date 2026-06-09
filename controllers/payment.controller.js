const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PaymentTransaction = require("../models/paymentTransaction.model");
const SubscriptionPlan = require("../models/subscriptionPlan.model");
const UserSubscription = require("../models/userSubscription.model");
const status = require("../utils/statusCodes");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_Sz4vwMJo8gQiQT",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "kLR840GKU2nuk7CLAiJ6E5nU",
});

// 1. Create a Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { planId, durationInDays } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    // Check if the user already has this exact plan active
    const existingSubscription = await UserSubscription.findOne({
      userId,
      planId,
      status: "active",
      endDate: { $gte: new Date() },
      deletedAt: null,
    });

    if (existingSubscription) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "You have already purchased this plan and it is currently active.",
      });
    }

    // Fetch the plan details to get pricing
    const userRole = req.user ? req.user.role : null;
    let targetRole = null;
    if (userRole === 'user') targetRole = 'user';
    else if (userRole === 'broker' || userRole === 'channel_partner') targetRole = 'broker_channel_partner';
    else if (userRole === 'builder') targetRole = 'builder';

    const planQuery = {
      _id: planId,
      deletedAt: null,
    };
    if (targetRole) {
      planQuery.targetRole = targetRole;
    }

    const plan = await SubscriptionPlan.findOne(planQuery);
    if (!plan) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Subscription plan not found or not applicable for your role",
      });
    }

    if (plan.isActive === false) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "This subscription plan is currently inactive",
      });
    }

    const pricingOption = plan.pricing && plan.pricing.find(p => p.durationInDays === Number(durationInDays));
    if (!pricingOption) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid duration selected for this plan",
      });
    }

    // Razorpay amount expects to be in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(pricingOption.price * 100);

    if (amountInPaise < 100) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Plan price must be at least ₹1 to process through Razorpay",
      });
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(status.InternalServerError).json({
        success: false,
        message: "Error creating Razorpay order",
      });
    }

    // Save pending transaction
    const paymentTransaction = await PaymentTransaction.create({
      user: userId,
      plan: planId,
      durationInDays: pricingOption.durationInDays,
      orderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      status: "pending",
    });

    return res.status(status.CREATED).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: paymentTransaction._id,
      },
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    const errorMessage = error.error ? error.error.description : error.message;
    
    return res.status(status.InternalServerError).json({
      success: false,
      message: errorMessage || "Internal server error",
    });
  }
};

// 2. Verify Razorpay Payment Signature
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    const transaction = await PaymentTransaction.findOne({ orderId: razorpay_order_id });
    if (!transaction) {
      return res.status(status.NotFound).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status === "completed") {
      return res.status(status.BadRequest).json({ success: false, message: "Payment already verified" });
    }

    // Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "RdUgOe7ZTaISL5QdB1KOy6Ed";
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", secret).update(body.toString()).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      transaction.status = "failed";
      await transaction.save();
      return res.status(status.BadRequest).json({ success: false, message: "Invalid payment signature. Verification failed." });
    }

    // Fetch payment details directly from Razorpay to automatically grab the method (e.g. card, upi, wallet)
    let paymentMethod = null;
    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      paymentMethod = paymentDetails.method;
    } catch (err) {
      console.log("Error fetching Razorpay payment details:", err.message);
    }

    // Update transaction state
    transaction.paymentId = razorpay_payment_id;
    transaction.razorpay_signature = razorpay_signature;
    transaction.status = "completed";
    if (paymentMethod) {
      transaction.paymentMethod = paymentMethod;
    }
    await transaction.save();

    // ---- Activate User Subscription ----
    const plan = await SubscriptionPlan.findById(transaction.plan);
    if (!plan) {
      return res.status(status.NotFound).json({ success: false, message: "Associated subscription plan not found" });
    }

    const durationInDays = transaction.durationInDays || 30;
    const pricingOption = plan.pricing && plan.pricing.find(p => p.durationInDays === durationInDays);
    const planPrice = pricingOption ? pricingOption.price : 0;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationInDays);

    // Deactivate previous active plans to enforce a single active plan rule
    await UserSubscription.updateMany(
      { userId, status: "active" },
      { $set: { status: "expired" } }
    );

    // Activate new subscription
    const subscription = await UserSubscription.create({
      userId,
      planId: transaction.plan,
      planName: plan.planName,
      planDescription: plan.planDescription,
      durationInDays: durationInDays,
      listingVisibilityPercentage: plan.listingVisibilityPercentage,
      planBenefits: plan.planBenefits,
      planPrice: planPrice,
      startDate,
      endDate,
      status: "active",
      paymentStatus: "paid",
      paymentAmount: planPrice,
      transactionId: transaction._id.toString(),
    });

    return res.status(status.OK).json({
      success: true,
      message: "Payment verified and subscription activated successfully",
      data: {
        transaction,
        subscription,
      },
    });
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// 3. Get All Payment Transactions (Admin Only)
exports.getAllPaymentTransactions = async (req, res) => {
  try {
    // Enforce Admin role
    if (req.user.role !== "admin") {
      return res.status(status.Forbidden).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { page = 1, limit = 10, paymentStatus } = req.query;

    const filter = {};
    if (paymentStatus) {
      filter.status = paymentStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(filter)
        .populate("user", "name email phone role")
        .populate("plan", "planName targetRole pricing")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PaymentTransaction.countDocuments(filter),
    ]);

    return res.status(status.OK).json({
      success: true,
      message: "Payment transactions fetched successfully",
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
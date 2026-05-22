const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPlan',
            required: true,
            index: true,
        },

        planName: {
            type: String,
            required: true,
            trim: true,
        },

        planDescription: {
            type: String,
            required: true,
            trim: true,
        },

        durationInMonths: {
            type: Number,
            required: true,
            min: 1,
        },

        listingVisibilityPercentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        planBenefits: [
            {
                type: String,
                trim: true,
            },
        ],

        planPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: ['pending', 'active', 'expired', 'cancelled'],
            default: 'active',
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'paid',
        },

        paymentAmount: {
            type: Number,
            default: 0,
            min: 0,
        },

        transactionId: {
            type: String,
            trim: true,
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

userSubscriptionSchema.index({ userId: 1, status: 1, endDate: -1 });
userSubscriptionSchema.index({ userId: 1, planId: 1 });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);

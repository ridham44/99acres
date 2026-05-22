const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
    {
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

        isActive: {
            type: Boolean,
            default: true,
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

subscriptionPlanSchema.index({ planName: 1, deletedAt: 1 });
subscriptionPlanSchema.index({ isActive: 1, deletedAt: 1 });

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

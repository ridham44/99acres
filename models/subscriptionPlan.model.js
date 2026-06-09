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

        targetRole: {
            type: String,
            enum: ['user', 'broker_channel_partner', 'builder'],
            required: true,
        },

        pricing: [
            {
                durationInDays: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],

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

const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: 'Privacy Policy',
        },

        // HTML content of the policy
        content: {
            type: String,
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: false,
    },
);

module.exports = mongoose.model('PrivacyPolicy', privacyPolicySchema);

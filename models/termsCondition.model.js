const mongoose = require('mongoose');

const termsConditionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: 'Terms & Conditions',
        },

        // HTML content of the terms
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

module.exports = mongoose.model('TermsCondition', termsConditionSchema);

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        otp: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            enum: ['register', 'login'],
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        lastSentAt: {
            type: Date,
            required: true,
        },

        resendCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

otpSchema.index({ userId: 1, type: 1 }, { unique: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
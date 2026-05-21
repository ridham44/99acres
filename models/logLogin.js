const mongoose = require('mongoose');

const logLoginSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        isAdmin: {
            type: Boolean,
            default: false,
        },

        logoutAt: {
            type: Date,
            default: null,
        },

        sessionDuration: {
            type: String,
            default: null,
            trim: true,
        },

        ipAddress: {
            type: String,
            default: null,
            trim: true,
        },

        browserDetail: {
            type: String,
            default: null,
            trim: true,
        },

        isLogin: {
            type: Boolean,
            default: true,
        },

        deviceType: {
            type: String,
            default: null,
            trim: true,
        },

        deviceId: {
            type: String,
            default: null,
            trim: true,
        },

        token: {
            type: String,
            default: null,
            trim: true,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    },
);

logLoginSchema.index({ userId: 1 });
logLoginSchema.index({ token: 1 });
logLoginSchema.index({ deviceId: 1 });
logLoginSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LogLogin', logLoginSchema);

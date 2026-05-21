const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        propertiesListed: {
            type: Number,
            default: 0,
        },

        verifiedProperties: {
            type: Number,
            default: 0,
        },

        soldProperties: {
            type: Number,
            default: 0,
        },

        rentedProperties: {
            type: Number,
            default: 0,
        },

        activeProperties: {
            type: Number,
            default: 0,
        },

        pendingProperties: {
            type: Number,
            default: 0,
        },

        rejectedProperties: {
            type: Number,
            default: 0,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    },
);

module.exports = mongoose.model('UserStatus', userStatusSchema);

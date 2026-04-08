const mongoose = require('mongoose');

const shortlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },

        shortListedAt: {
            type: Date,
            default: Date.now,
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

shortlistSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('Shortlist', shortlistSchema);

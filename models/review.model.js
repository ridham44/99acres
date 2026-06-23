const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        name: {
            type: String,
            trim: true,
            required: true,
        },

        positiveKeywordIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PositiveKeyword',
            },
        ],

        negativeKeywordIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'NegativeKeyword',
            },
        ],

        comment: {
            type: String,
            trim: true,
            default: '',
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
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

module.exports = mongoose.model('Review', reviewSchema);

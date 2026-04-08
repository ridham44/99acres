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

        userType: {
            type: String,
            enum: ['Owner', 'Tenant'],
            required: true,
        },

        stayDuration: {
            type: String,
            trim: true,
            required: true,
        },

        connectivity: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        lifestyle: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        safety: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        environment: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },

        positive: {
            type: String,
            trim: true,
            default: '',
        },

        negative: {
            type: String,
            trim: true,
            default: '',
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

        agreeCount: {
            type: Number,
            default: 0,
        },

        disagreeCount: {
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

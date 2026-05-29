const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        transactionType: {
            type: String,
            enum: ['Buy', 'Rent', 'Commercial'],
            required: true,
            index: true,
        },

        locations: [
            {
                type: String,
                trim: true,
            },
        ],

        area: {
            type: String,
            trim: true,
            default: null,
        },

        propertyTypes: [
            {
                type: String,
                trim: true,
            },
        ],

        lookingTo: {
            type: String,
            trim: true,
        },

        sharingPreference: [
            {
                type: String,
                trim: true,
            },
        ],

        pgServices: [
            {
                type: String,
                trim: true,
            },
        ],

        totalCapacity: {
            type: String,
            trim: true,
        },

        minimumBathrooms: {
            type: Number,
            default: 0,
        },

        commercialLandTypes: [
            {
                type: String,
                trim: true,
            },
        ],

        preferredPlotTypes: [
            {
                type: String,
                trim: true,
            },
        ],

        facingDirections: [
            {
                type: String,
                trim: true,
            },
        ],

        postedBy: [
            {
                type: String,
                trim: true,
            },
        ],

        purchaseType: [
            {
                type: String,
                trim: true,
            },
        ],

        amenityIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Amenity',
            },
        ],

        isReraApproved: {
            type: Boolean,
            default: false,
        },

        availableFor: [
            {
                type: String,
                trim: true,
            },
        ],

        availableFrom: [
            {
                type: String,
                trim: true,
            },
        ],

        propertyAge: [
            {
                type: String,
                trim: true,
            },
        ],

        constructionStatus: [
            {
                type: String,
                trim: true,
            },
        ],

        furnishingStatus: [
            {
                type: String,
                trim: true,
            },
        ],

        investmentOptions: [
            {
                type: String,
                trim: true,
            },
        ],

        bhks: [
            {
                type: String,
                trim: true,
            },
        ],

        minArea: {
            type: Number,
            default: 0,
        },

        maxArea: {
            type: Number,
            default: 0,
        },

        minBudget: {
            type: Number,
            default: 0,
        },

        maxBudget: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Fulfilled', 'Closed'],
            default: 'Active',
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

// Indexes for matching as suggested in theory guide
requirementSchema.index({ transactionType: 1, lookingTo: 1 });
requirementSchema.index({ minBudget: 1, maxBudget: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);

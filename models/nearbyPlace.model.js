const mongoose = require('mongoose');

const nearbyPlaceSchema = new mongoose.Schema(
    {
        city: {
            type: String,
            required: true,
            trim: true,
        },
        locality: {
            type: String,
            required: true,
            trim: true,
        },
        placeName: {
            type: String,
            required: true,
            trim: true,
        },
        placeType: {
            type: String,
            required: true,
            trim: true,
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

module.exports = mongoose.model('NearbyPlace', nearbyPlaceSchema);

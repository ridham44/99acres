const mongoose = require('mongoose');

const amenitySchema = new mongoose.Schema(
    {
        amenityName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        amenityIcon: {
            type: String,
            default: null,
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

module.exports = mongoose.model('Amenity', amenitySchema);

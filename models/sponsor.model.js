const mongoose = require('mongoose');

const sponsorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        logo: {
            type: String,
            default: null,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        websiteUrl: {
            type: String,
            trim: true,
            default: '',
        },
        displayOrder: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
            index: true,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Sponsor', sponsorSchema);

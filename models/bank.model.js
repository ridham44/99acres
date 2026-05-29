const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema(
    {
        bankName: {
            type: String,
            required: true,
            trim: true,
        },
        bankIcon: {
            type: String,
            default: null,
        },
        interest: {
            type: Number,
            required: true,
        },
        about: {
            type: String,
            trim: true,
            default: '',
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
    }
);

module.exports = mongoose.model('Bank', bankSchema);

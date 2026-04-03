const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
        },

        role: {
            type: String,
            enum: ['user', 'broker', 'dealer', 'builder'],
            default: 'user',
        },

        agencyName: {
            type: String,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        email: {
            type: String,
            trim: true,
            unique: true,
            lowercase: true,
            sparse: true,
        },

        city: {
            type: String,
            trim: true,
        },

        state: {
            type: String,
            trim: true,
        },

        documents: [
            {
                type: String,
                trim: true,
            },
        ],

        isVerified: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('User', userSchema);

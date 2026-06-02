const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        shortDescription: {
            type: String,
            required: true,
            trim: true,
        },
        coverImage: {
            type: String,
            default: null,
            trim: true,
        },
        authorName: {
            type: String,
            required: true,
            trim: true,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        views: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        publishedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Guide', guideSchema);

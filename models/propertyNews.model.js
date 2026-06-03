const mongoose = require('mongoose');

const propertyNewsSchema = new mongoose.Schema(
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
        },
        summary: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        coverImage: {
            type: String,
            default: null,
            trim: true,
        },
        images: [
            {
                type: String,
                trim: true,
            },
        ],
        city: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        source: {
            type: String,
            trim: true,
            default: '',
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

propertyNewsSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('PropertyNews', propertyNewsSchema);

const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
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
        category: {
            type: String,
            required: true,
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
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

blogSchema.index(
    { slug: 1 },
    {
        unique: true,
        partialFilterExpression: { deletedAt: null },
    }
);

module.exports = mongoose.model('Blog', blogSchema);

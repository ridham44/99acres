const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // null means general broadcast or directed by recipientType
        },
        recipientType: {
            type: String,
            enum: ['user', 'admin', 'all'],
            default: 'user',
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['inquiry', 'property_approval', 'subscription', 'support_ticket', 'general'],
            default: 'general',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        relatedModel: {
            type: String,
            default: null,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast query of unread notifications per user/admin
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

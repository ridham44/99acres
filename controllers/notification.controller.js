const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const status = require('../utils/statusCodes');

/**
 * Fetch all notifications targeting the logged-in user or admin, paginated.
 */
exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // Build recipient target filter based on user roles
        const query = {
            deletedAt: null,
            $or: [
                { recipientId: userId },
                { recipientType: 'all' },
            ],
        };

        // If the user is an admin, they should also see general admin notifications
        if (req.user.role === 'admin') {
            query.$or.push({ recipientType: 'admin' });
        }

        const notifications = await Notification.find(query)
            .populate('senderId', 'name email profileImage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

        return res.status(status.OK).json({
            success: true,
            message: 'Notifications fetched successfully',
            data: {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
                unreadCount,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Mark a specific notification as read.
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid notification ID',
            });
        }

        const notification = await Notification.findOne({ _id: id, deletedAt: null });

        if (!notification) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Notification not found',
            });
        }

        // Verify recipient permission to perform read operation
        const isTargetAdmin = notification.recipientType === 'admin';
        const isTargetAll = notification.recipientType === 'all';
        const isDirectRecipient = notification.recipientId && notification.recipientId.toString() === req.user.id;

        const isAuthorized = isDirectRecipient || 
                            (isTargetAdmin && req.user.role === 'admin') || 
                            isTargetAll;

        if (!isAuthorized) {
            return res.status(status.Forbidden).json({
                success: false,
                message: 'You are not authorized to mark this notification as read',
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Notification marked as read successfully',
            data: notification,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Mark all notifications for the current user/admin as read.
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const query = {
            deletedAt: null,
            isRead: false,
            $or: [
                { recipientId: userId },
            ],
        };

        if (req.user.role === 'admin') {
            query.$or.push({ recipientType: 'admin' });
        }

        await Notification.updateMany(query, {
            isRead: true,
            readAt: new Date(),
        });

        return res.status(status.OK).json({
            success: true,
            message: 'All notifications marked as read successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Soft delete a specific notification.
 */
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid notification ID',
            });
        }

        const notification = await Notification.findOne({ _id: id, deletedAt: null });

        if (!notification) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Notification not found',
            });
        }

        // Verify recipient permission to perform delete operation
        const isTargetAdmin = notification.recipientType === 'admin';
        const isTargetAll = notification.recipientType === 'all';
        const isDirectRecipient = notification.recipientId && notification.recipientId.toString() === req.user.id;

        const isAuthorized = isDirectRecipient || 
                            (isTargetAdmin && req.user.role === 'admin') || 
                            isTargetAll;

        if (!isAuthorized) {
            return res.status(status.Forbidden).json({
                success: false,
                message: 'You are not authorized to delete this notification',
            });
        }

        notification.deletedAt = new Date();
        await notification.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

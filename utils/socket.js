const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { jwt: jwtConfig } = require('../config/auth');
const LogLogin = require('../models/logLogin');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

let io;
const userSockets = new Map(); // Map of userId string -> Set of socketIds (to support multiple tabs/devices)

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Set to specific origins in production
            methods: ['GET', 'POST'],
        },
    });

    // Socket.io JWT and Session Verification Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify the JWT token
            const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
            if (!decoded.id) {
                return next(new Error('Authentication error: Invalid token payload'));
            }

            // Cross-reference with active sessions in LogLogin
            const logLogin = await LogLogin.findOne({
                userId: new mongoose.Types.ObjectId(decoded.id),
                token,
                isLogin: true,
            });

            if (!logLogin) {
                return next(new Error('Authentication error: Session expired or invalid'));
            }

            // Verify the user exists in database and retrieve role
            const user = await User.findById(decoded.id).select('name role email');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user details to socket context
            socket.user = {
                id: user._id.toString(),
                name: user.name,
                role: user.role,
                email: user.email,
            };

            next();
        } catch (error) {
            return next(new Error('Authentication error: Invalid or expired token'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const role = socket.user.role;

        // Register socket to user socket map
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Join user-specific notification room
        socket.join(`user_${userId}`);

        // Join admin-specific notification room if user is an admin
        if (role === 'admin') {
            socket.join('admins');
        }

        console.log(`Socket connected: ${socket.id} | User: ${userId} | Role: ${role}`);

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id} | User: ${userId}`);
            
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            }
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};

// Core Helper: Real-time emitter to a specific user room
const sendToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

// Core Helper: Real-time emitter to all admin room subscribers
const sendToAdmins = (event, data) => {
    if (io) {
        io.to('admins').emit(event, data);
    }
};

// Core Helper: Broadcast event to all connected sockets
const broadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

// Core Helper: Send event to multiple user rooms in real-time
const sendToUsers = (userIds, event, data) => {
    if (io && Array.isArray(userIds)) {
        userIds.forEach((userId) => {
            io.to(`user_${userId}`).emit(event, data);
        });
    }
};

/**
 * Unified helper to persist a notification in MongoDB AND dispatch it in real-time.
 * 
 * @param {Object} params
 * @param {String} [params.senderId] - ID of the user triggering the notification (null for system)
 * @param {String} [params.recipientId] - Target user ID (null for broadcast / all admins)
 * @param {String} [params.recipientType] - 'user', 'admin', or 'all'
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification detail/message
 * @param {String} [params.type] - Category ('inquiry', 'property_approval', 'subscription', 'support_ticket', 'general')
 * @param {String} [params.relatedId] - Reference to associated Mongoose document ID
 * @param {String} [params.relatedModel] - Model name string (e.g. 'Property', 'Inquiry')
 */
const createAndSendNotification = async ({
    senderId = null,
    recipientId = null,
    recipientType = 'user',
    title,
    message,
    type = 'general',
    relatedId = null,
    relatedModel = null,
}) => {
    try {
        // 1. Create and save notification document in Mongoose DB
        const notification = await Notification.create({
            senderId,
            recipientId,
            recipientType,
            title,
            message,
            type,
            relatedId,
            relatedModel,
        });

        const notificationData = {
            id: notification._id,
            senderId,
            recipientId,
            recipientType,
            title,
            message,
            type,
            relatedId,
            relatedModel,
            isRead: false,
            createdAt: notification.createdAt,
        };

        // 2. Dispatch real-time Socket.io event based on target/recipient
        if (recipientType === 'admin') {
            sendToAdmins('notification', notificationData);
        } else if (recipientType === 'all') {
            broadcast('notification', notificationData);
        } else if (recipientId) {
            sendToUser(recipientId.toString(), 'notification', notificationData);
        }

        return notification;
    } catch (error) {
        console.error('Error creating/sending notification:', error);
        throw error;
    }
};

module.exports = {
    initSocket,
    getIO,
    sendToUser,
    sendToAdmins,
    broadcast,
    sendToUsers,
    createAndSendNotification,
};

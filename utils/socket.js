const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { jwt: jwtConfig } = require('../config/auth');
const LogLogin = require('../models/logLogin');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

let io;

// Map of userId (string) → Set of socketIds (supports multiple tabs/devices)
const userSockets = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // ─── JWT Authentication Middleware ────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            let token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization ||
                socket.handshake.query?.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Strip "Bearer " prefix (case-insensitive) if present
            if (/^bearer\s+/i.test(token)) {
                token = token.replace(/^bearer\s+/i, '').trim();
            }

            // Verify JWT
            let decoded;
            try {
                decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
            } catch (jwtErr) {
                console.error('[Socket] JWT verify failed:', jwtErr.message);
                return next(new Error('Authentication error: Invalid or expired token'));
            }

            if (!decoded.id) {
                return next(new Error('Authentication error: Invalid token payload'));
            }

            // Cross-reference with active session in LogLogin
            const logLogin = await LogLogin.findOne({
                userId: new mongoose.Types.ObjectId(decoded.id),
                token,
                isLogin: true,
            });

            if (!logLogin) {
                console.warn(`[Socket] No active session found for userId=${decoded.id}`);
                return next(new Error('Authentication error: Session expired or invalid'));
            }

            // Fetch full user record for role info
            const user = await User.findById(decoded.id).select('name role email');
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            // Attach user info to socket context
            socket.user = {
                id: user._id.toString(),
                name: user.name,
                role: user.role,
                email: user.email,
            };

            next();
        } catch (error) {
            console.error('[Socket] Auth middleware error:', error.message);
            return next(new Error('Authentication error: ' + error.message));
        }
    });

    // ─── Connection Handler ───────────────────────────────────────────────────
    io.on('connection', (socket) => {
        const userId = socket.user.id;
        const role = socket.user.role;
        const roomPrefixed = `user_${userId}`;
        const roomRaw = userId;

        // Track socket in userSockets map
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Join personal notification rooms (both prefixed and raw)
        socket.join(roomPrefixed);
        socket.join(roomRaw);

        // Admins additionally join the shared admins room
        if (role === 'admin') {
            socket.join('admins');
        }

        console.log(
            `[Socket] ✅ Connected  | socketId=${socket.id} | userId=${userId} | role=${role} | rooms=[${roomPrefixed}, ${roomRaw}]`
        );

        // Handle custom join/register/setup events emitted manually by frontend/Flutter client
        const handleClientRoomRegistration = (data) => {
            let targetId = null;
            if (typeof data === 'string') {
                targetId = data.trim();
            } else if (data && typeof data === 'object') {
                targetId = (data.userId || data.id || data.room || '').toString().trim();
            }

            if (targetId && targetId.length > 5) {
                const clientRoomPrefixed = `user_${targetId}`;
                const clientRoomRaw = targetId;

                socket.join(clientRoomPrefixed);
                socket.join(clientRoomRaw);

                console.log(
                    `[Socket] 🔄 Client custom registration event | socketId=${socket.id} | userId=${userId} | rooms=[${clientRoomPrefixed}, ${clientRoomRaw}]`
                );
            }
        };

        // Listen for all common room subscription events sent by various client-side controllers
        socket.on('join', handleClientRoomRegistration);
        socket.on('register', handleClientRoomRegistration);
        socket.on('setup', handleClientRoomRegistration);
        socket.on('joinRoom', handleClientRoomRegistration);
        socket.on('login', handleClientRoomRegistration);

        // Send a welcome/ping event so the client can confirm connectivity
        socket.emit('connected', {
            message: 'Socket connected successfully',
            userId,
            role,
            rooms: [roomPrefixed, roomRaw],
        });

        socket.on('disconnect', (reason) => {
            console.log(
                `[Socket] ❌ Disconnected | socketId=${socket.id} | userId=${userId} | reason=${reason}`
            );

            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                }
            }
        });

        // Heartbeat — client can ping, server pongs back
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
    });

    return io;
};

// ─── Getters ──────────────────────────────────────────────────────────────────

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};

/**
 * Returns true if at least one socket for the given userId is currently online.
 */
const isUserOnline = (userId) => {
    return userSockets.has(userId.toString()) && userSockets.get(userId.toString()).size > 0;
};

/**
 * Returns all currently connected user IDs.
 */
const getOnlineUserIds = () => {
    return [...userSockets.keys()];
};

/**
 * Emit an event to a specific user's personal room.
 */
const sendToUser = (userId, event, data) => {
    if (!io) {
        console.warn('[Socket] sendToUser called before io is initialized');
        return;
    }

    const userIdStr = userId.toString();
    const roomPrefixed = `user_${userIdStr}`;
    const roomRaw = userIdStr;
    const online = isUserOnline(userIdStr);

    console.log(
        `[Socket] sendToUser → rooms=[${roomPrefixed}, ${roomRaw}] | event=${event} | userOnline=${online}`
    );

    // Emit to both formats to support both Flutter controller patterns
    io.to(roomPrefixed).emit(event, data);
    io.to(roomRaw).emit(event, data);
};

/**
 * Emit an event to all sockets in the admins room.
 */
const sendToAdmins = (event, data) => {
    if (!io) return;
    console.log(`[Socket] sendToAdmins → event=${event}`);
    io.to('admins').emit(event, data);
};

/**
 * Broadcast an event to ALL connected sockets (no room filter).
 */
const broadcast = (event, data) => {
    if (!io) return;
    console.log(`[Socket] broadcast → event=${event}`);
    io.emit(event, data);
};

/**
 * Emit an event to multiple user rooms in bulk.
 */
const sendToUsers = (userIds, event, data) => {
    if (!io || !Array.isArray(userIds)) return;
    userIds.forEach((userId) => {
        sendToUser(userId, event, data);
    });
};

// ─── Unified Notification Helper ──────────────────────────────────────────────

/**
 * Persist a notification to MongoDB AND dispatch it via Socket.io in real-time.
 *
 * @param {Object}  params
 * @param {String}  [params.senderId]       - ID of the triggering user (null = system)
 * @param {String}  [params.recipientId]    - Target user ID (null for broadcast / all admins)
 * @param {String}  [params.recipientType]  - 'user' | 'admin' | 'all'
 * @param {String}  params.title            - Short notification title
 * @param {String}  params.message          - Full notification body
 * @param {String}  [params.type]           - 'inquiry' | 'property_approval' | 'subscription' | 'support_ticket' | 'general'
 * @param {String}  [params.relatedId]      - ObjectId of related document
 * @param {String}  [params.relatedModel]   - Model name (e.g. 'PropertyDocument')
 * @returns {Promise<Notification>}
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
        // 1. Persist to MongoDB
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

        const payload = {
            id: notification._id.toString(),
            senderId: senderId ? senderId.toString() : null,
            recipientId: recipientId ? recipientId.toString() : null,
            recipientType,
            title,
            message,
            type,
            relatedId: relatedId ? relatedId.toString() : null,
            relatedModel,
            isRead: false,
            createdAt: notification.createdAt,
        };

        console.log(
            `[Socket] createAndSendNotification | recipientType=${recipientType} | recipientId=${recipientId} | type=${type}`
        );

        // 2. Real-time dispatch
        if (recipientType === 'admin') {
            sendToAdmins('notification', payload);
        } else if (recipientType === 'all') {
            broadcast('notification', payload);
        } else if (recipientId) {
            // Target a specific user room
            sendToUser(recipientId.toString(), 'notification', payload);
        } else {
            console.warn('[Socket] createAndSendNotification: recipientType=user but no recipientId provided');
        }

        return notification;
    } catch (error) {
        console.error('[Socket] Error in createAndSendNotification:', error);
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
    isUserOnline,
    getOnlineUserIds,
    createAndSendNotification,
};

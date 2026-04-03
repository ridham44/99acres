const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { jwt: jwtConfig } = require('../config/auth');
const status = require('../utils/statusCodes');
const LogLogin = require('../models/logLogin');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
        const rawAuthorizationToken = authHeader && !authHeader.startsWith('Bearer ') ? String(authHeader).trim() : null;
        const fallbackToken = req.headers['x-access-token'] || req.headers.token;

        const token = bearerToken || rawAuthorizationToken || fallbackToken;
        const deviceId = req.headers['x-device-id'] || req.headers.deviceid || null;

        if (!token) {
            return res.status(status.Unauthorized).json({
                success: false,
                message: 'Unauthorized: No token provided',
            });
        }

        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);

        if (!decoded.id) {
            return res.status(status.Unauthorized).json({
                success: false,
                message: 'Unauthorized: Invalid token payload',
            });
        }

        const logLogin = await LogLogin.findOne({
            userId: new mongoose.Types.ObjectId(decoded.id),
            token,
            isLogin: true,
        }).sort({ createdAt: -1 });

        if (!logLogin) {
            return res.status(status.Unauthorized).json({
                success: false,
                message: 'Unauthorized: Session expired or already logged out',
            });
        }

        if (logLogin.deviceId) {
            if (!deviceId) {
                return res.status(status.Unauthorized).json({
                    success: false,
                    message: 'Unauthorized: Device id is required',
                });
            }

            if (logLogin.deviceId !== deviceId) {
                return res.status(status.Unauthorized).json({
                    success: false,
                    message: 'Unauthorized: This token is not allowed on this device',
                });
            }
        }

        const requestIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip || null;

        // console.log('Saved IP:', logLogin.ipAddress);
        // console.log('Request IP:', requestIp);

        if (logLogin.ipAddress && requestIp) {
            if (logLogin.ipAddress !== requestIp) {
                return res.status(status.Unauthorized).json({
                    success: false,
                    message: 'Unauthorized: IP address mismatch',
                });
            }
        }

        const user = (req.user = {
            id: decoded.id,
            name: decoded.name || null,
            email: decoded.email || null,
            phone: decoded.phone || null,
            role: decoded.role || null,
            isAdmin: decoded.isAdmin || false,
        });

        req.token = token;
        req.logLogin = logLogin;

        next();
    } catch (error) {
        return res.status(status.Unauthorized).json({
            success: false,
            message: 'Unauthorized: Invalid or expired token',
        });
    }
};

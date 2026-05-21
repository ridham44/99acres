const mongoose = require('mongoose');

const User = require('../models/user.model');
const LogLogin = require('../models/logLogin');
const service = require('./auth.service');
const { generateToken } = require('../utils/jwt');
const status = require('../utils/statusCodes');

exports.register = async (req, res) => {
    try {
        const { name, phone, role, agencyName, email, city, state, documents } = req.body;

        let user = await User.findOne({ phone, deletedAt: null });

        if (!user) {
            user = await User.create({
                name,
                phone,
                role,
                agencyName,
                email,
                city,
                state,
                documents: Array.isArray(documents) ? documents : [],
            });
        }

        const otp = await service.createOtp(user._id, 'register');

        console.log('OTP:', otp);

        return res.status(status.OK).json({
            success: true,
            message: 'OTP sent successfully',
            otp: otp,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.verifyRegisterOtp = async (req, res) => {
    try {
        const { phone, otp, deviceId, deviceType } = req.body;

        const user = await User.findOne({ phone, deletedAt: null });

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const result = await service.verifyOtp(user._id, otp, 'register');

        if (!result.success) {
            return res.status(status.BadRequest).json({
                success: false,
                message: result.message,
            });
        }

        user.isVerified = true;
        await user.save();

        const token = generateToken({
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            deviceId,
        });

        const forwardedFor = req.headers['x-forwarded-for'];
        const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket?.remoteAddress || req.ip;

        await LogLogin.create({
            userId: user._id,
            isAdmin: false,
            ipAddress: realIp,
            browserDetail: req.headers['user-agent'] || null,
            isLogin: true,
            deviceType: deviceType || 'web',
            deviceId: deviceId || null,
            token,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Registration successful',
            token,
            data: {
                id: user._id,
                name: user.name,
                role: user.role,
                agencyName: user.agencyName,
                phone: user.phone,
                email: user.email,
                city: user.city,
                state: user.state,
                documents: user.documents,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findOne({ phone, deletedAt: null });

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const otp = await service.createOtp(user._id, 'login');

        console.log('OTP:', otp);

        return res.status(status.OK).json({
            success: true,
            message: 'OTP sent for login',
            otp: otp,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.verifyLoginOtp = async (req, res) => {
    try {
        const { phone, otp, deviceId, deviceType } = req.body;

        const user = await User.findOne({ phone, deletedAt: null });

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const result = await service.verifyOtp(user._id, otp, 'login');

        if (!result.success) {
            return res.status(status.BadRequest).json({
                success: false,
                message: result.message,
            });
        }

        const token = generateToken({
            id: user._id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            deviceId,
        });

        const forwardedFor = req.headers['x-forwarded-for'];
        const realIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket?.remoteAddress || req.ip;

        await LogLogin.create({
            userId: user._id,
            isAdmin: false,
            ipAddress: realIp,
            browserDetail: req.headers['user-agent'] || null,
            isLogin: true,
            deviceType: deviceType || 'web',
            deviceId: deviceId || null,
            token,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Login successful',
            token,
            data: {
                id: user._id,
                name: user.name,
                role: user.role,
                agencyName: user.agencyName,
                phone: user.phone,
                email: user.email,
                city: user.city,
                state: user.state,
                documents: user.documents,
                isVerified: user.isVerified,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { phone, type } = req.body;

        if (!['register', 'login'].includes(type)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid type',
            });
        }

        const user = await User.findOne({ phone, deletedAt: null });

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const result = await service.resendOtp(user._id, type);

        if (!result.success) {
            return res.status(status.BadRequest).json({
                success: false,
                message: result.message,
            });
        }

        console.log('Resent OTP:', result.otp);

        return res.status(status.OK).json({
            success: true,
            message: 'OTP resent successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const logLogin = await LogLogin.findOne({
            userId: new mongoose.Types.ObjectId(req.user.id),
            token: req.token,
            isLogin: true,
        }).sort({ createdAt: -1 });

        if (!logLogin) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Active login session not found',
            });
        }

        const logoutAt = new Date();
        const diffMs = logoutAt - logLogin.createdAt;

        const totalSeconds = Math.floor(diffMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        logLogin.logoutAt = logoutAt;
        logLogin.sessionDuration = `${hours}h ${minutes}m ${seconds}s`;
        logLogin.isLogin = false;

        await logLogin.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getLogLoginList = async (req, res) => {
    try {
        const { page = 1, limit = 10, isAdmin, isLogin, userId, deviceType, search } = req.query;

        const filter = {};

        if (typeof isAdmin !== 'undefined') {
            filter.isAdmin = isAdmin === 'true';
        }

        if (typeof isLogin !== 'undefined') {
            filter.isLogin = isLogin === 'true';
        }

        if (userId) {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid userId',
                });
            }

            filter.userId = new mongoose.Types.ObjectId(userId);
        }

        if (deviceType) {
            filter.deviceType = { $regex: deviceType, $options: 'i' };
        }

        if (search) {
            filter.$or = [
                { ipAddress: { $regex: search, $options: 'i' } },
                { browserDetail: { $regex: search, $options: 'i' } },
                { deviceType: { $regex: search, $options: 'i' } },
                { deviceId: { $regex: search, $options: 'i' } },
            ];
        }

        const pageNumber = Number(page) || 1;
        const limitNumber = Number(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        const total = await LogLogin.countDocuments(filter);

        const data = await LogLogin.find(filter)
            .populate('userId', 'name phone email role agencyName city state isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        return res.status(status.OK).json({
            success: true,
            message: 'Log login list fetched successfully',
            total,
            page: pageNumber,
            limit: limitNumber,
            data,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

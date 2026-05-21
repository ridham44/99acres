const status = require('../utils/statusCodes');

const nameRegex = /^[A-Za-z\s]+$/;
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const User = require('../models/user.model');

exports.validateRegister = async (req, res, next) => {
    try {
        const { name, phone, role, agencyName, email } = req.body;

        if (!name) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Name is required',
            });
        }

        if (!nameRegex.test(name)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Name must contain only alphabets',
            });
        }

        if (!phone) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Phone number is required',
            });
        }

        if (!phoneRegex.test(phone)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Phone number must be 10 digits',
            });
        }

        if (['broker', 'dealer', 'builder'].includes(role)) {
            if (!agencyName) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Agency name is required for this role',
                });
            }
        }

        if (email) {
            if (!emailRegex.test(email)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid email format',
                });
            }

           
            const existingEmail = await User.findOne({
                email,
                deletedAt: null
            });

            if (existingEmail) {
                return res.status(status.Conflict).json({
                    success: false,
                    message: 'Email already exists',
                });
            }
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateVerifyRegisterOtp = (req, res, next) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !phoneRegex.test(phone)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid 10-digit phone number is required',
            });
        }

        if (!otp) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'OTP is required',
            });
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateLogin = (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone || !phoneRegex.test(phone)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid 10-digit phone number is required',
            });
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateVerifyLoginOtp = (req, res, next) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !phoneRegex.test(phone)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid 10-digit phone number is required',
            });
        }

        if (!otp) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'OTP is required',
            });
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const otpGenerator = require('otp-generator');

const Otp = require('../models/otp.model');
const { otp: otpConfig } = require('../config/auth');

exports.generateOtp = () => {
    return otpGenerator.generate(otpConfig.length, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
};

exports.createOtp = async (userId, type) => {
    const now = new Date();
    const otpCode = exports.generateOtp();

    let otpRecord = await Otp.findOne({ userId, type });

    if (!otpRecord) {
        otpRecord = await Otp.create({
            userId,
            type,
            otp: otpCode,
            expiresAt: new Date(now.getTime() + otpConfig.expiryInMinutes * 60 * 1000),
            lastSentAt: now,
            resendCount: 0,
        });
    } else {
        otpRecord.otp = otpCode;
        otpRecord.expiresAt = new Date(now.getTime() + otpConfig.expiryInMinutes * 60 * 1000);
        otpRecord.lastSentAt = now;
        otpRecord.resendCount = 0;
        await otpRecord.save();
    }

    return otpCode;
};

exports.resendOtp = async (userId, type) => {
    const now = new Date();

    const otpRecord = await Otp.findOne({ userId, type });

    if (!otpRecord) {
        return {
            success: false,
            message: 'No OTP request found',
        };
    }

    const resendCooldown = otpConfig.resendCooldown || 60;
    const maxResend = otpConfig.maxResend || 3;
    const diff = (now - otpRecord.lastSentAt) / 1000;

    if (diff < resendCooldown) {
        return {
            success: false,
            message: `Wait ${Math.ceil(resendCooldown - diff)} seconds`,
        };
    }

    if (otpRecord.resendCount >= maxResend) {
        return {
            success: false,
            message: 'Max resend limit reached',
        };
    }

    const newOtp = exports.generateOtp();

    otpRecord.otp = newOtp;
    otpRecord.expiresAt = new Date(now.getTime() + otpConfig.expiryInMinutes * 60 * 1000);
    otpRecord.lastSentAt = now;
    otpRecord.resendCount += 1;

    await otpRecord.save();

    return {
        success: true,
        otp: newOtp,
    };
};

exports.verifyOtp = async (userId, enteredOtp, type) => {
    const otpRecord = await Otp.findOne({ userId, type });

    if (!otpRecord) {
        return {
            success: false,
            message: 'OTP not found',
        };
    }

    if (otpRecord.otp !== enteredOtp) {
        return {
            success: false,
            message: 'Invalid OTP',
        };
    }

    if (otpRecord.expiresAt < new Date()) {
        return {
            success: false,
            message: 'OTP expired',
        };
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    return {
        success: true,
    };
};

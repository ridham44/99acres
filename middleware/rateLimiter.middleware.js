const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.OTP_RATE_LIMIT,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again later.',
    },
});

module.exports = {
    otpLimiter,
};

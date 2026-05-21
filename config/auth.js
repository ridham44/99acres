module.exports = {
    jwt: {
        accessTokenSecret: process.env.JWT_SECRET,

        accessTokenExpiry: process.env.JWT_EXPIRY,
    },

    otp: {
        length: Number(process.env.OTP_LENGTH) || 6,
        expiryInMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
        resendCooldown: Number(process.env.OTP_RESEND_COOLDOWN) || 120,
        maxResend: Number(process.env.OTP_MAX_RESEND) || 3,
    },
};

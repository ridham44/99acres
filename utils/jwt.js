const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/auth');

exports.generateToken = (payload) => {
    return jwt.sign(payload, jwtConfig.accessTokenSecret, {
        expiresIn: jwtConfig.accessTokenExpiry,
    });
};

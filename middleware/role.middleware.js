const status = require('../utils/statusCodes');

module.exports = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(status.Forbidden).json({
                success: false,
                message: `Forbidden: This resource is only accessible by ${roles.join(', ')}`,
            });
        }
        next();
    };
};

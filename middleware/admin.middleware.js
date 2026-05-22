const status = require('../utils/statusCodes');

module.exports = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && !req.user.isAdmin)) {
        return res.status(status.Forbidden).json({
            success: false,
            message: 'Forbidden: Admin access required',
        });
    }

    next();
};

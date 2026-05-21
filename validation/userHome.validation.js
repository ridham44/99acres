const status = require('../utils/statusCodes');

const numberFields = {
    visitedLimit: { min: 1, max: 20 },
    newLaunchLimit: { min: 1, max: 20 },
    sponsoredLimit: { min: 1, max: 20 },
    topAreaLimit: { min: 1, max: 10 },
    topPropertyLimit: { min: 1, max: 10 },
};

exports.validateGetUserHome = (req, res, next) => {
    try {
        for (const [field, range] of Object.entries(numberFields)) {
            if (req.query[field] === undefined) {
                continue;
            }

            const value = Number(req.query[field]);

            if (!Number.isInteger(value) || value < range.min || value > range.max) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: `${field} must be an integer between ${range.min} and ${range.max}`,
                });
            }

            req.query[field] = value;
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

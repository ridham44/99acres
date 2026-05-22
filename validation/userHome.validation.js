const status = require('../utils/statusCodes');

const numberFields = {
    visitedLimit: { min: 1, max: 20 },
    newLaunchLimit: { min: 1, max: 20 },
    sponsoredLimit: { min: 1, max: 20 },
    topAreaLimit: { min: 1, max: 10 },
    topPropertyLimit: { min: 1, max: 10 },
};

const visitedPropertyNumberFields = {
    page: { min: 1, max: 100000 },
    limit: { min: 1, max: 100 },
};

const validateNumberFields = (req, res, fields) => {
    for (const [field, range] of Object.entries(fields)) {
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

    return null;
};

exports.validateGetUserHome = (req, res, next) => {
    try {
        const errorResponse = validateNumberFields(req, res, numberFields);
        if (errorResponse) {
            return errorResponse;
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateGetVisitedProperties = (req, res, next) => {
    try {
        const errorResponse = validateNumberFields(req, res, visitedPropertyNumberFields);
        if (errorResponse) {
            return errorResponse;
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

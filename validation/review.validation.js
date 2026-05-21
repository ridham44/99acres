const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const validateObjectIdArray = (arr) => {
    if (!Array.isArray(arr)) {
        return false;
    }

    return arr.every((id) => mongoose.Types.ObjectId.isValid(id));
};

exports.validateCreateReview = (req, res, next) => {
    try {
        const {
            propertyId,
            userType,
            stayDuration,
            connectivity,
            lifestyle,
            safety,
            environment,
            positiveKeywordIds = [],
            negativeKeywordIds = [],
        } = req.body;

        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid propertyId is required',
            });
        }

        if (!userType || !['Owner', 'Tenant'].includes(userType)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid userType is required',
            });
        }

        if (!stayDuration || typeof stayDuration !== 'string' || !stayDuration.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Stay duration is required',
            });
        }

        if (Number(connectivity) < 1 || Number(connectivity) > 5) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Connectivity must be between 1 and 5',
            });
        }

        if (Number(lifestyle) < 1 || Number(lifestyle) > 5) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Lifestyle must be between 1 and 5',
            });
        }

        if (Number(safety) < 1 || Number(safety) > 5) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Safety must be between 1 and 5',
            });
        }

        if (Number(environment) < 1 || Number(environment) > 5) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Environment must be between 1 and 5',
            });
        }

        if (!validateObjectIdArray(positiveKeywordIds)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'positiveKeywordIds must be a valid ObjectId array',
            });
        }

        if (!validateObjectIdArray(negativeKeywordIds)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'negativeKeywordIds must be a valid ObjectId array',
            });
        }

        if (req.body.positive && typeof req.body.positive !== 'string') {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Positive must be a string',
            });
        }

        if (req.body.negative && typeof req.body.negative !== 'string') {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Negative must be a string',
            });
        }

        req.body.stayDuration = stayDuration.trim();
        req.body.positive = req.body.positive ? req.body.positive.trim() : '';
        req.body.negative = req.body.negative ? req.body.negative.trim() : '';
        req.body.connectivity = Number(connectivity);
        req.body.lifestyle = Number(lifestyle);
        req.body.safety = Number(safety);
        req.body.environment = Number(environment);

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

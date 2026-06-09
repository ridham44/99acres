const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

exports.validateBuySubscriptionPlan = (req, res, next) => {
    const { planId } = req.body;

    if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
        return sendError(res, 'Valid planId is required');
    }

    next();
};

exports.validateGetMySubscriptions = (req, res, next) => {
    try {
        req.query.page = toNumber(req.query.page);
        if (req.query.page !== undefined) {
            if (!Number.isInteger(req.query.page) || req.query.page < 1) {
                return sendError(res, 'page must be an integer greater than or equal to 1');
            }
        }

        req.query.limit = toNumber(req.query.limit);
        if (req.query.limit !== undefined) {
            if (!Number.isInteger(req.query.limit) || req.query.limit < 1 || req.query.limit > 100) {
                return sendError(res, 'limit must be an integer between 1 and 100');
            }
        }

        if (req.query.status === '') {
            req.query.status = undefined;
        }

        if (
            req.query.status !== undefined &&
            !['pending', 'active', 'expired', 'cancelled'].includes(req.query.status)
        ) {
            return sendError(res, 'Invalid subscription status');
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

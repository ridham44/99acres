const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const requiredString = (value) => typeof value === 'string' && value.trim() !== '';

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

const toBoolean = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
    }
    return value;
};

const toStringArray = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed;
        } catch (error) {
            return value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    return value;
};

const normalizeBody = (req) => {
    req.body.durationInMonths = toNumber(req.body.durationInMonths);
    req.body.listingVisibilityPercentage = toNumber(req.body.listingVisibilityPercentage);
    req.body.planPrice = toNumber(req.body.planPrice);
    req.body.isActive = toBoolean(req.body.isActive);
    req.body.planBenefits = toStringArray(req.body.planBenefits);
};

const validateNumber = (res, field, value, min, max = null, required = true) => {
    if (value === undefined) {
        return required ? sendError(res, `${field} is required`) : null;
    }

    if (typeof value !== 'number' || Number.isNaN(value) || value < min || (max !== null && value > max)) {
        const rangeMessage = max === null ? `greater than or equal to ${min}` : `between ${min} and ${max}`;
        return sendError(res, `${field} must be a number ${rangeMessage}`);
    }

    return null;
};

const validateBenefits = (res, benefits, required = true) => {
    if (benefits === undefined) {
        return required ? sendError(res, 'planBenefits is required') : null;
    }

    if (!Array.isArray(benefits)) {
        return sendError(res, 'planBenefits must be an array of strings');
    }

    const cleanedBenefits = benefits.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);

    if (cleanedBenefits.some((item) => typeof item !== 'string')) {
        return sendError(res, 'planBenefits must be an array of strings');
    }

    if (required && cleanedBenefits.length === 0) {
        return sendError(res, 'planBenefits must contain at least one benefit');
    }

    return null;
};

exports.validateCreateSubscriptionPlan = (req, res, next) => {
    try {
        normalizeBody(req);

        if (!requiredString(req.body.planName)) {
            return sendError(res, 'planName is required');
        }

        if (!requiredString(req.body.planDescription)) {
            return sendError(res, 'planDescription is required');
        }

        const durationError = validateNumber(res, 'durationInMonths', req.body.durationInMonths, 1);
        if (durationError) return durationError;

        const visibilityError = validateNumber(
            res,
            'listingVisibilityPercentage',
            req.body.listingVisibilityPercentage,
            0,
            100,
        );
        if (visibilityError) return visibilityError;

        const priceError = validateNumber(res, 'planPrice', req.body.planPrice, 0);
        if (priceError) return priceError;

        const benefitsError = validateBenefits(res, req.body.planBenefits);
        if (benefitsError) return benefitsError;

        if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
            return sendError(res, 'isActive must be a boolean');
        }

        req.body.planName = req.body.planName.trim();
        req.body.planDescription = req.body.planDescription.trim();
        req.body.planBenefits = req.body.planBenefits.map((item) => item.trim()).filter(Boolean);

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateUpdateSubscriptionPlan = (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, 'Invalid subscription plan id');
        }

        normalizeBody(req);

        if (req.body.planName !== undefined && !requiredString(req.body.planName)) {
            return sendError(res, 'planName must not be empty');
        }

        if (req.body.planDescription !== undefined && !requiredString(req.body.planDescription)) {
            return sendError(res, 'planDescription must not be empty');
        }

        const durationError = validateNumber(res, 'durationInMonths', req.body.durationInMonths, 1, null, false);
        if (durationError) return durationError;

        const visibilityError = validateNumber(
            res,
            'listingVisibilityPercentage',
            req.body.listingVisibilityPercentage,
            0,
            100,
            false,
        );
        if (visibilityError) return visibilityError;

        const priceError = validateNumber(res, 'planPrice', req.body.planPrice, 0, null, false);
        if (priceError) return priceError;

        const benefitsError = validateBenefits(res, req.body.planBenefits, false);
        if (benefitsError) return benefitsError;

        if (req.body.isActive !== undefined && typeof req.body.isActive !== 'boolean') {
            return sendError(res, 'isActive must be a boolean');
        }

        if (req.body.planName !== undefined) req.body.planName = req.body.planName.trim();
        if (req.body.planDescription !== undefined) req.body.planDescription = req.body.planDescription.trim();
        if (req.body.planBenefits !== undefined) {
            req.body.planBenefits = req.body.planBenefits.map((item) => item.trim()).filter(Boolean);
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateSubscriptionPlanId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid subscription plan id');
    }

    next();
};

exports.validateGetSubscriptionPlans = (req, res, next) => {
    try {
        if (req.query.page !== undefined) {
            req.query.page = toNumber(req.query.page);
            if (!Number.isInteger(req.query.page) || req.query.page < 1) {
                return sendError(res, 'page must be an integer greater than or equal to 1');
            }
        }

        if (req.query.limit !== undefined) {
            req.query.limit = toNumber(req.query.limit);
            if (!Number.isInteger(req.query.limit) || req.query.limit < 1 || req.query.limit > 100) {
                return sendError(res, 'limit must be an integer between 1 and 100');
            }
        }

        if (req.query.isActive !== undefined) {
            req.query.isActive = toBoolean(req.query.isActive);
            if (typeof req.query.isActive !== 'boolean') {
                return sendError(res, 'isActive must be a boolean');
            }
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

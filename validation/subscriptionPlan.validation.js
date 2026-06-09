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
    req.body.listingVisibilityPercentage = toNumber(req.body.listingVisibilityPercentage);
    req.body.isActive = toBoolean(req.body.isActive);
    req.body.planBenefits = toStringArray(req.body.planBenefits);

    if (req.body.pricing && typeof req.body.pricing === 'string') {
        try { req.body.pricing = JSON.parse(req.body.pricing); } 
        catch (error) {}
    }

    if (req.body.targetRole === 'owner') {
        req.body.targetRole = 'user';
    }
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

const validatePricing = (res, pricing, required = true) => {
    if (pricing === undefined) return required ? sendError(res, 'pricing array is required') : null;
    if (!Array.isArray(pricing)) return sendError(res, 'pricing must be an array');
    if (required && pricing.length === 0) return sendError(res, 'pricing must contain at least one option');
    
    const durations = new Set();

    for (let i = 0; i < pricing.length; i++) {
        const opt = pricing[i];
        if (!opt || typeof opt !== 'object') return sendError(res, 'pricing options must be objects');
        opt.durationInDays = toNumber(opt.durationInDays);
        opt.price = toNumber(opt.price);
        
        if (typeof opt.durationInDays !== 'number' || opt.durationInDays < 1) return sendError(res, 'durationInDays in pricing must be a number >= 1');
        if (typeof opt.price !== 'number' || opt.price < 0) return sendError(res, 'price in pricing must be a number >= 0');

        if (durations.has(opt.durationInDays)) {
            return sendError(res, `Duplicate duration (${opt.durationInDays} days) is not allowed in pricing.`);
        }
        durations.add(opt.durationInDays);
    }

    if (pricing.length > 1) {
        const sortedPricing = [...pricing].sort((a, b) => a.durationInDays - b.durationInDays);
        
        for (let i = 1; i < sortedPricing.length; i++) {
            if (sortedPricing[i].price <= sortedPricing[i - 1].price) {
                return sendError(
                    res, 
                    `Invalid pricing logic: Price for ${sortedPricing[i].durationInDays} days (₹${sortedPricing[i].price}) must be higher than the price for ${sortedPricing[i - 1].durationInDays} days (₹${sortedPricing[i - 1].price}).`
                );
            }
        }
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

        if (!requiredString(req.body.targetRole) || !['user', 'broker_channel_partner', 'builder'].includes(req.body.targetRole)) {
            return sendError(res, 'targetRole is required and must be user, broker_channel_partner, or builder');
        }

        const pricingError = validatePricing(res, req.body.pricing);
        if (pricingError) return pricingError;

        const visibilityError = validateNumber(
            res,
            'listingVisibilityPercentage',
            req.body.listingVisibilityPercentage,
            0,
            100,
        );
        if (visibilityError) return visibilityError;

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

        if (req.body.targetRole !== undefined && !['user', 'broker_channel_partner', 'builder'].includes(req.body.targetRole)) {
            return sendError(res, 'targetRole must be user, broker_channel_partner, or builder');
        }

        if (req.body.pricing !== undefined) {
            const pricingError = validatePricing(res, req.body.pricing, false);
            if (pricingError) return pricingError;
        }

        const visibilityError = validateNumber(
            res,
            'listingVisibilityPercentage',
            req.body.listingVisibilityPercentage,
            0,
            100,
            false,
        );
        if (visibilityError) return visibilityError;

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

        req.query.isActive = toBoolean(req.query.isActive);
        if (req.query.isActive !== undefined) {
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

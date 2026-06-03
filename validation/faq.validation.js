const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const allowedCategories = [
    'payment',
    'booking',
    'account',
    'property',
    'subscription',
    'general',
];

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const requiredString = (value) => typeof value === 'string' && value.trim() !== '';

const trimFields = (body, fields) => {
    fields.forEach((field) => {
        if (typeof body[field] === 'string') {
            body[field] = body[field].trim();
        }
    });
};

const validateCategory = (category) => allowedCategories.includes(category);

exports.validateGetSupportData = (req, res, next) => {
    if (req.query.category !== undefined && !validateCategory(req.query.category)) {
        return sendError(res, `category must be one of: ${allowedCategories.join(', ')}`);
    }

    next();
};

exports.validateGetFAQs = (req, res, next) => {
    if (req.query.category !== undefined && !validateCategory(req.query.category)) {
        return sendError(res, `category must be one of: ${allowedCategories.join(', ')}`);
    }

    next();
};

exports.validateCreateFAQ = (req, res, next) => {
    trimFields(req.body, ['topicId', 'category', 'question', 'answer']);

    for (const field of ['topicId', 'category', 'question', 'answer']) {
        if (!requiredString(req.body[field])) {
            return sendError(res, `${field} is required and must be a non-empty string`);
        }
    }

    if (!validateCategory(req.body.category)) {
        return sendError(res, `category must be one of: ${allowedCategories.join(', ')}`);
    }

    next();
};

exports.validateUpdateFAQ = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid FAQ id');
    }

    trimFields(req.body, ['topicId', 'category', 'question', 'answer']);

    for (const field of ['topicId', 'category', 'question', 'answer']) {
        if (req.body[field] !== undefined && !requiredString(req.body[field])) {
            return sendError(res, `${field} must be a non-empty string`);
        }
    }

    if (req.body.category !== undefined && !validateCategory(req.body.category)) {
        return sendError(res, `category must be one of: ${allowedCategories.join(', ')}`);
    }

    next();
};

exports.validateFAQId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid FAQ id');
    }

    next();
};

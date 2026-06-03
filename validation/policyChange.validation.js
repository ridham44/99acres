const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const allowedStatuses = ['active', 'inactive'];

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

const validatePublishedAt = (value) => {
    if (value === undefined || value === '') return undefined;
    if (value === null) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'INVALID_DATE' : date;
};

const trimFields = (body, fields) => {
    fields.forEach((field) => {
        if (typeof body[field] === 'string') {
            body[field] = body[field].trim();
        }
    });
};

exports.validateCreatePolicyChange = (req, res, next) => {
    req.body.publishedAt = validatePublishedAt(req.body.publishedAt);

    if (!requiredString(req.body.title)) {
        return sendError(res, 'title is required and must be a non-empty string');
    }

    if (!requiredString(req.body.content)) {
        return sendError(res, 'content is required and must be a non-empty string');
    }

    if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    if (req.body.publishedAt === 'INVALID_DATE') {
        return sendError(res, 'publishedAt must be a valid date');
    }

    trimFields(req.body, ['title', 'content', 'status']);
    next();
};

exports.validateUpdatePolicyChange = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid policy change id');
    }

    req.body.publishedAt = validatePublishedAt(req.body.publishedAt);

    for (const field of ['title', 'content']) {
        if (req.body[field] !== undefined && !requiredString(req.body[field])) {
            return sendError(res, `${field} must be a non-empty string`);
        }
    }

    if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    if (req.body.publishedAt === 'INVALID_DATE') {
        return sendError(res, 'publishedAt must be a valid date');
    }

    trimFields(req.body, ['title', 'content', 'status']);
    next();
};

exports.validatePolicyChangeId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid policy change id');
    }
    next();
};

exports.validateGetPolicyChanges = (req, res, next) => {
    req.query.page = toNumber(req.query.page);
    req.query.limit = toNumber(req.query.limit);

    if (req.query.page !== undefined && (!Number.isInteger(req.query.page) || req.query.page < 1)) {
        return sendError(res, 'page must be a positive integer');
    }

    if (req.query.limit !== undefined && (!Number.isInteger(req.query.limit) || req.query.limit < 1)) {
        return sendError(res, 'limit must be a positive integer');
    }

    if (req.query.status !== undefined && !allowedStatuses.includes(req.query.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    next();
};

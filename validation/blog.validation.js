const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const allowedStatuses = ['draft', 'published', 'archived'];

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const requiredString = (value) => typeof value === 'string' && value.trim() !== '';

const optionalString = (value) => value === undefined || typeof value === 'string';

const toBoolean = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
};

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

const trimFields = (body, fields) => {
    fields.forEach((field) => {
        if (typeof body[field] === 'string') {
            body[field] = body[field].trim();
        }
    });
};

const validatePublishedAt = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

exports.validateCreateBlog = (req, res, next) => {
    try {
        req.body.isFeatured = toBoolean(req.body.isFeatured);
        req.body.views = toNumber(req.body.views);
        req.body.publishedAt = validatePublishedAt(req.body.publishedAt);

        if (!requiredString(req.body.title)) {
            return sendError(res, 'title is required and must be a non-empty string');
        }

        if (req.body.slug !== undefined && !requiredString(req.body.slug)) {
            return sendError(res, 'slug must be a non-empty string');
        }

        if (!requiredString(req.body.summary)) {
            return sendError(res, 'summary is required and must be a non-empty string');
        }

        if (!requiredString(req.body.content)) {
            return sendError(res, 'content is required and must be a non-empty string');
        }

        if (!requiredString(req.body.category)) {
            return sendError(res, 'category is required and must be a non-empty string');
        }

        if (req.body.authorName !== undefined && !requiredString(req.body.authorName)) {
            return sendError(res, 'authorName must be a non-empty string');
        }

        if (req.body.views !== undefined && (typeof req.body.views !== 'number' || req.body.views < 0)) {
            return sendError(res, 'views must be a number greater than or equal to 0');
        }

        if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
            return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
        }

        if (req.body.isFeatured !== undefined && typeof req.body.isFeatured !== 'boolean') {
            return sendError(res, 'isFeatured must be true or false');
        }

        if (req.body.publishedAt === null) {
            return sendError(res, 'publishedAt must be a valid date');
        }

        trimFields(req.body, ['title', 'slug', 'summary', 'content', 'category', 'authorName', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateUpdateBlog = (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, 'Invalid blog id');
        }

        req.body.isFeatured = toBoolean(req.body.isFeatured);
        req.body.views = toNumber(req.body.views);
        req.body.publishedAt = validatePublishedAt(req.body.publishedAt);

        for (const field of ['title', 'slug', 'summary', 'content', 'category', 'authorName']) {
            if (req.body[field] !== undefined && !requiredString(req.body[field])) {
                return sendError(res, `${field} must be a non-empty string`);
            }
        }

        if (!optionalString(req.body.status)) {
            return sendError(res, 'status must be a string');
        }

        if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
            return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
        }

        if (req.body.views !== undefined && (typeof req.body.views !== 'number' || req.body.views < 0)) {
            return sendError(res, 'views must be a number greater than or equal to 0');
        }

        if (req.body.isFeatured !== undefined && typeof req.body.isFeatured !== 'boolean') {
            return sendError(res, 'isFeatured must be true or false');
        }

        if (req.body.publishedAt === null) {
            return sendError(res, 'publishedAt must be a valid date');
        }

        trimFields(req.body, ['title', 'slug', 'summary', 'content', 'category', 'authorName', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateBlogId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid blog id');
    }
    next();
};

exports.validateGetBlogs = (req, res, next) => {
    req.query.page = toNumber(req.query.page);
    req.query.limit = toNumber(req.query.limit);
    req.query.isFeatured = toBoolean(req.query.isFeatured);

    if (req.query.page !== undefined && (!Number.isInteger(req.query.page) || req.query.page < 1)) {
        return sendError(res, 'page must be a positive integer');
    }

    if (req.query.limit !== undefined && (!Number.isInteger(req.query.limit) || req.query.limit < 1)) {
        return sendError(res, 'limit must be a positive integer');
    }

    if (req.query.status !== undefined && !allowedStatuses.includes(req.query.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    if (req.query.isFeatured !== undefined && typeof req.query.isFeatured !== 'boolean') {
        return sendError(res, 'isFeatured must be true or false');
    }

    next();
};

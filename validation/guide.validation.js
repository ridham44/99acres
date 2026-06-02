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

const toNumber = (value) => {
    if (Array.isArray(value)) value = value[0];
    if (typeof value === 'string') value = value.trim();
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

const toPositiveInteger = (value) => {
    const parsed = toNumber(value);
    if (parsed === undefined) return undefined;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toBoolean = (value) => {
    if (Array.isArray(value)) value = value[0];
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
};

const toDate = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const trimFields = (body, fields) => {
    fields.forEach((field) => {
        if (typeof body[field] === 'string') body[field] = body[field].trim();
    });
};

exports.validateGuideId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid guide id');
    }

    next();
};

exports.validateGuideParamId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.guideId)) {
        return sendError(res, 'Invalid guide id');
    }

    next();
};

exports.validateChildId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid id');
    }

    next();
};

exports.validateCreateGuide = (req, res, next) => {
    try {
        req.body.views = toNumber(req.body.views);
        req.body.isFeatured = toBoolean(req.body.isFeatured);
        req.body.publishedAt = toDate(req.body.publishedAt);

        if (!requiredString(req.body.title)) {
            return sendError(res, 'title is required and must be a non-empty string');
        }

        if (req.body.slug !== undefined && !requiredString(req.body.slug)) {
            return sendError(res, 'slug must be a non-empty string');
        }

        if (!requiredString(req.body.shortDescription)) {
            return sendError(res, 'shortDescription is required and must be a non-empty string');
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

        trimFields(req.body, ['title', 'slug', 'shortDescription', 'authorName', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.validateUpdateGuide = (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, 'Invalid guide id');
        }

        req.body.views = toNumber(req.body.views);
        req.body.isFeatured = toBoolean(req.body.isFeatured);
        req.body.publishedAt = toDate(req.body.publishedAt);

        for (const field of ['title', 'slug', 'shortDescription', 'authorName']) {
            if (req.body[field] !== undefined && !requiredString(req.body[field])) {
                return sendError(res, `${field} must be a non-empty string`);
            }
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

        trimFields(req.body, ['title', 'slug', 'shortDescription', 'authorName', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.validateGetGuides = (req, res, next) => {
    req.query.page = toPositiveInteger(req.query.page);
    req.query.limit = toPositiveInteger(req.query.limit);
    req.query.isFeatured = toBoolean(req.query.isFeatured);

    if (req.query.page === null) return sendError(res, 'page must be a positive integer');
    if (req.query.limit === null) return sendError(res, 'limit must be a positive integer');

    if (req.query.status !== undefined && !allowedStatuses.includes(req.query.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    if (req.query.isFeatured !== undefined && typeof req.query.isFeatured !== 'boolean') {
        return sendError(res, 'isFeatured must be true or false');
    }

    next();
};

exports.validateCreateChapter = (req, res, next) => {
    req.body.sortOrder = toNumber(req.body.sortOrder);

    if (!requiredString(req.body.title)) {
        return sendError(res, 'title is required and must be a non-empty string');
    }

    if (!requiredString(req.body.content)) {
        return sendError(res, 'content is required and must be a non-empty string');
    }

    if (req.body.sortOrder !== undefined && typeof req.body.sortOrder !== 'number') {
        return sendError(res, 'sortOrder must be a number');
    }

    trimFields(req.body, ['title', 'content']);
    next();
};

exports.validateUpdateChapter = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid chapter id');
    }

    req.body.sortOrder = toNumber(req.body.sortOrder);

    for (const field of ['title', 'content']) {
        if (req.body[field] !== undefined && !requiredString(req.body[field])) {
            return sendError(res, `${field} must be a non-empty string`);
        }
    }

    if (req.body.sortOrder !== undefined && typeof req.body.sortOrder !== 'number') {
        return sendError(res, 'sortOrder must be a number');
    }

    trimFields(req.body, ['title', 'content']);
    next();
};

exports.validateCreateTakeaway = (req, res, next) => {
    req.body.sortOrder = toNumber(req.body.sortOrder);

    if (!requiredString(req.body.content)) {
        return sendError(res, 'content is required and must be a non-empty string');
    }

    if (req.body.sortOrder !== undefined && typeof req.body.sortOrder !== 'number') {
        return sendError(res, 'sortOrder must be a number');
    }

    trimFields(req.body, ['content']);
    next();
};

exports.validateUpdateTakeaway = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid takeaway id');
    }

    req.body.sortOrder = toNumber(req.body.sortOrder);

    if (req.body.content !== undefined && !requiredString(req.body.content)) {
        return sendError(res, 'content must be a non-empty string');
    }

    if (req.body.sortOrder !== undefined && typeof req.body.sortOrder !== 'number') {
        return sendError(res, 'sortOrder must be a number');
    }

    trimFields(req.body, ['content']);
    next();
};

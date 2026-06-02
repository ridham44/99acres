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

const validateDateRange = (req, res) => {
    if (req.body.startDate === null) {
        return sendError(res, 'startDate must be a valid date');
    }

    if (req.body.endDate === null) {
        return sendError(res, 'endDate must be a valid date');
    }

    if (req.body.startDate && req.body.endDate && req.body.endDate < req.body.startDate) {
        return sendError(res, 'endDate must be greater than or equal to startDate');
    }

    return null;
};

exports.validateSponsorId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid sponsor id');
    }

    next();
};

exports.validateCreateSponsor = (req, res, next) => {
    try {
        req.body.displayOrder = toNumber(req.body.displayOrder);
        req.body.startDate = toDate(req.body.startDate);
        req.body.endDate = toDate(req.body.endDate);

        if (!requiredString(req.body.name)) {
            return sendError(res, 'name is required and must be a non-empty string');
        }

        if (!requiredString(req.body.location)) {
            return sendError(res, 'location is required and must be a non-empty string');
        }

        if (req.body.websiteUrl !== undefined && typeof req.body.websiteUrl !== 'string') {
            return sendError(res, 'websiteUrl must be a string');
        }

        if (req.body.displayOrder !== undefined && typeof req.body.displayOrder !== 'number') {
            return sendError(res, 'displayOrder must be a number');
        }

        if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
            return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
        }

        const dateError = validateDateRange(req, res);
        if (dateError) return dateError;

        trimFields(req.body, ['name', 'location', 'websiteUrl', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.validateUpdateSponsor = (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, 'Invalid sponsor id');
        }

        req.body.displayOrder = toNumber(req.body.displayOrder);
        req.body.startDate = toDate(req.body.startDate);
        req.body.endDate = toDate(req.body.endDate);

        for (const field of ['name', 'location']) {
            if (req.body[field] !== undefined && !requiredString(req.body[field])) {
                return sendError(res, `${field} must be a non-empty string`);
            }
        }

        if (req.body.websiteUrl !== undefined && typeof req.body.websiteUrl !== 'string') {
            return sendError(res, 'websiteUrl must be a string');
        }

        if (req.body.displayOrder !== undefined && typeof req.body.displayOrder !== 'number') {
            return sendError(res, 'displayOrder must be a number');
        }

        if (req.body.status !== undefined && !allowedStatuses.includes(req.body.status)) {
            return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
        }

        const dateError = validateDateRange(req, res);
        if (dateError) return dateError;

        trimFields(req.body, ['name', 'location', 'websiteUrl', 'status']);
        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.validateGetSponsors = (req, res, next) => {
    req.query.page = toPositiveInteger(req.query.page);
    req.query.limit = toPositiveInteger(req.query.limit);
    req.query.displayOrder = toNumber(req.query.displayOrder);

    if (req.query.page === null) return sendError(res, 'page must be a positive integer');
    if (req.query.limit === null) return sendError(res, 'limit must be a positive integer');

    if (req.query.status !== undefined && !allowedStatuses.includes(req.query.status)) {
        return sendError(res, `status must be one of: ${allowedStatuses.join(', ')}`);
    }

    if (req.query.displayOrder !== undefined && typeof req.query.displayOrder !== 'number') {
        return sendError(res, 'displayOrder must be a number');
    }

    next();
};

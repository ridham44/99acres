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

exports.validateCreateBank = (req, res, next) => {
    try {
        if (req.body.interest !== undefined) {
            req.body.interest = toNumber(req.body.interest);
        }

        if (!requiredString(req.body.bankName)) {
            return sendError(res, 'bankName is required and must be a non-empty string');
        }

        if (req.body.interest === undefined) {
            return sendError(res, 'interest is required');
        }

        if (typeof req.body.interest !== 'number' || Number.isNaN(req.body.interest) || req.body.interest < 0) {
            return sendError(res, 'interest must be a number greater than or equal to 0');
        }

        if (req.body.about !== undefined && typeof req.body.about !== 'string') {
            return sendError(res, 'about must be a string');
        }

        req.body.bankName = req.body.bankName.trim();
        if (req.body.about !== undefined) {
            req.body.about = req.body.about.trim();
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateUpdateBank = (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendError(res, 'Invalid bank id');
        }

        if (req.body.interest !== undefined) {
            req.body.interest = toNumber(req.body.interest);
        }

        if (req.body.bankName !== undefined && !requiredString(req.body.bankName)) {
            return sendError(res, 'bankName must be a non-empty string');
        }

        if (req.body.interest !== undefined && (typeof req.body.interest !== 'number' || Number.isNaN(req.body.interest) || req.body.interest < 0)) {
            return sendError(res, 'interest must be a number greater than or equal to 0');
        }

        if (req.body.about !== undefined && typeof req.body.about !== 'string') {
            return sendError(res, 'about must be a string');
        }

        if (req.body.bankName !== undefined) {
            req.body.bankName = req.body.bankName.trim();
        }
        if (req.body.about !== undefined) {
            req.body.about = req.body.about.trim();
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateBankId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return sendError(res, 'Invalid bank id');
    }
    next();
};

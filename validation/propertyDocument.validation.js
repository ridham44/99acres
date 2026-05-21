const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const documentTypes = [
    'Ownership Proof',
    'Agreement',
    'Floor Plan',
    'Brochure',
    'Property Tax Receipt',
    'ID Proof',
    'Other',
];

const documentStatuses = ['Active', 'Inactive'];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const validateRequiredString = (value) => typeof value === 'string' && value.trim() !== '';

const validateCreatePropertyDocument = (req, res, next) => {
    try {
        const { propertyId, documentType, title, status: documentStatus } = req.body;

        if (!propertyId || !isValidObjectId(propertyId)) {
            return sendError(res, 'Valid propertyId is required');
        }

        if (!documentType || !documentTypes.includes(documentType)) {
            return sendError(res, 'Invalid documentType');
        }

        if (!validateRequiredString(title)) {
            return sendError(res, 'Title is required');
        }

        if (documentStatus && !documentStatuses.includes(documentStatus)) {
            return sendError(res, 'Invalid status');
        }

        if (!req.file) {
            return sendError(res, 'Document file is required');
        }

        return next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const validateUpdatePropertyDocument = (req, res, next) => {
    try {
        const { id } = req.params;
        const { propertyId, documentType, title, status: documentStatus } = req.body;

        if (!isValidObjectId(id)) {
            return sendError(res, 'Invalid document id');
        }

        if (propertyId !== undefined && propertyId !== '' && !isValidObjectId(propertyId)) {
            return sendError(res, 'Invalid propertyId');
        }

        if (documentType !== undefined && !documentTypes.includes(documentType)) {
            return sendError(res, 'Invalid documentType');
        }

        if (title !== undefined && !validateRequiredString(title)) {
            return sendError(res, 'Title cannot be empty');
        }

        if (documentStatus !== undefined && !documentStatuses.includes(documentStatus)) {
            return sendError(res, 'Invalid status');
        }

        return next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const validatePropertyDocumentId = (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(res, 'Invalid document id');
        }

        return next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    validateCreatePropertyDocument,
    validateUpdatePropertyDocument,
    validatePropertyDocumentId,
};
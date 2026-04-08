const Property = require('../models/property.model');
const PropertyDocument = require('../models/propertyDocument.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getPropertyDocumentUrl } = require('../utils/imagekitUrl');

exports.createPropertyDocument = async (req, res) => {
    try {
        const { propertyId, documentType, title, status: documentStatus } = req.body;

        const property = await Property.findOne({
            _id: propertyId,
            deletedAt: null,
        });

        if (!property) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property not found',
            });
        }

        const uploaded = { fileName: 'test-file.pdf' };

        const document = await PropertyDocument.create({
            propertyId,
            documentType,
            title,
            fileName: uploaded.fileName,
            fileSize: req.file.size || 0,
            status: documentStatus || 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const documentObj = document.toObject();
        documentObj.fileUrl = getPropertyDocumentUrl(documentObj.fileName);

        return res.status(status.CREATED).json({
            success: true,
            message: 'Property document uploaded successfully',
            data: documentObj,
        });
    } catch (error) {
        console.log('CREATE PROPERTY DOCUMENT ERROR:', error);
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getPropertyDocuments = async (req, res) => {
    try {
        const { propertyId, documentType, status: documentStatus, page, limit } = req.query;

        const filter = { deletedAt: null };

        if (propertyId) {
            filter.propertyId = propertyId;
        }

        if (documentType) {
            filter.documentType = documentType;
        }

        if (documentStatus) {
            filter.status = documentStatus;
        }

        const currentPage = Number(page) || 1;
        const currentLimit = Number(limit) || 10;
        const skip = (currentPage - 1) * currentLimit;

        const [documents, total] = await Promise.all([
            PropertyDocument.find(filter)
                .populate('propertyId', 'title propertyName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(currentLimit),
            PropertyDocument.countDocuments(filter),
        ]);

        const data = documents.map((item) => {
            const doc = item.toObject();

            return {
                ...doc,
                fileUrl: getPropertyDocumentUrl(doc.fileName),
            };
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Property documents fetched successfully',
            data,
            pagination: {
                total,
                page: currentPage,
                limit: currentLimit,
                totalPages: Math.ceil(total / currentLimit),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPropertyDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await PropertyDocument.findOne({
            _id: id,
            deletedAt: null,
        }).populate('propertyId', 'title propertyName');

        if (!document) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property document not found',
            });
        }

        const documentObj = document.toObject();
        documentObj.fileUrl = getPropertyDocumentUrl(documentObj.fileName);

        return res.status(status.OK).json({
            success: true,
            message: 'Property document fetched successfully',
            data: documentObj,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updatePropertyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const existingDocument = await PropertyDocument.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!existingDocument) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property document not found',
            });
        }

        if (req.body.propertyId) {
            const property = await Property.findOne({
                _id: req.body.propertyId,
                deletedAt: null,
            });

            if (!property) {
                return res.status(status.NotFound).json({
                    success: false,
                    message: 'Property not found',
                });
            }
        }

        const updateData = {
            ...req.body,
            updatedAt: new Date(),
        };

        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'properties/documents');

            updateData.fileName = uploaded.fileName;
            updateData.fileSize = req.file.size || 0;
        }

        const document = await PropertyDocument.findOneAndUpdate({ _id: id, deletedAt: null }, updateData, { new: true }).populate(
            'propertyId',
            'title propertyName',
        );

        const documentObj = document.toObject();
        documentObj.fileUrl = getPropertyDocumentUrl(documentObj.fileName);

        return res.status(status.OK).json({
            success: true,
            message: 'Property document updated successfully',
            data: documentObj,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deletePropertyDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await PropertyDocument.findOneAndUpdate(
            { _id: id, deletedAt: null },
            {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!document) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property document not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Property document deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

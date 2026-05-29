const Property = require('../models/property.model');
const PropertyDocument = require('../models/propertyDocument.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getPropertyDocumentUrl } = require('../utils/imagekitUrl');
const { createAndSendNotification } = require('../utils/socket');

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
            fileSize: (req.file && req.file.size) || 0,
            status: 'Pending',
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

        // Restrict documents to properties belonging to the requesting user (unless admin)
        const requesterId = req.user && req.user.id;
        const requesterRole = req.user && req.user.role;

        if (requesterId && requesterRole !== 'admin') {
            if (propertyId) {
                const prop = await Property.findOne({ _id: propertyId, deletedAt: null }).select('ownerId dealerId');

                if (!prop) {
                    return res.status(status.NotFound).json({
                        success: false,
                        message: 'Property not found',
                    });
                }

                const ownerId = prop.ownerId ? prop.ownerId.toString() : null;
                const dealerIdVal = prop.dealerId ? prop.dealerId.toString() : null;

                if (ownerId !== requesterId && dealerIdVal !== requesterId) {
                    return res.status(status.Forbidden).json({
                        success: false,
                        message: 'Not authorized to view these documents',
                    });
                }
            } else {
                const userProperties = await Property.find({ deletedAt: null, $or: [{ ownerId: requesterId }, { dealerId: requesterId }] }).select('_id');
                const propIds = userProperties.map((p) => p._id);

                if (propIds.length === 0) {
                    return res.status(status.OK).json({
                        success: true,
                        message: 'Property documents fetched successfully',
                        data: [],
                        pagination: {
                            total: 0,
                            page: Number(page) || 1,
                            limit: Number(limit) || 10,
                            totalPages: 0,
                        },
                    });
                }

                filter.propertyId = { $in: propIds };
            }
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
            status: 'Pending', // Any edit resets status to Pending
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

// Admin/Authorized status update
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(newStatus)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid status. Must be Pending, Approved, or Rejected',
            });
        }

        const document = await PropertyDocument.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { status: newStatus, updatedAt: new Date() },
            { new: true },
        ).populate('propertyId', 'title propertyName ownerId dealerId');

        if (!document) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property document not found',
            });
        }

        // Notify property owner and dealer
        if (document.propertyId) {
            const property = document.propertyId;
            
            const recipients = [];
            if (property.ownerId) recipients.push(property.ownerId.toString());
            if (property.dealerId) recipients.push(property.dealerId.toString());
            
            // Get unique user IDs to avoid double-notification if ownerId === dealerId
            const uniqueRecipients = [...new Set(recipients)];

            for (const recipientId of uniqueRecipients) {
                await createAndSendNotification({
                    senderId: req.user.id,
                    recipientId: recipientId,
                    recipientType: 'user',
                    title: `Property Document Status: ${newStatus}`,
                    message: `Your document "${document.title}" for property "${property.title || property.propertyName}" has been ${newStatus.toLowerCase()}.`,
                    type: 'property_approval',
                    relatedId: document._id,
                    relatedModel: 'PropertyDocument',
                });
            }
        }

        return res.status(status.OK).json({
            success: true,
            message: `Property document status updated to ${newStatus}`,
            data: document,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

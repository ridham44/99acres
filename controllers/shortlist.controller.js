const mongoose = require('mongoose');
const Shortlist = require('../models/shortlist.model');
const Property = require('../models/property.model');
const status = require('../utils/statusCodes');
const { getPropertyMediaUrl } = require('../utils/imagekitUrl');

exports.addToShortlist = async (req, res) => {
    try {
        const { propertyId } = req.body;
        const userId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid property id',
            });
        }

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

        const existingShortlist = await Shortlist.findOne({
            userId,
            propertyId,
            deletedAt: null,
        });

        if (existingShortlist) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Property already shortlisted',
            });
        }

        let shortlist = await Shortlist.create({
            userId,
            propertyId,
            shortListedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Populate property details for the response
        shortlist = await shortlist.populate({
            path: 'propertyId',
            select: 'title propertyName name price address city state propertyType propertyCategory listingType area measureType media createdAt',
        });

        const data = shortlist.toObject();
        if (data.propertyId && data.propertyId.media) {
            data.propertyId.media = data.propertyId.media.map((m) => ({
                ...m,
                url: getPropertyMediaUrl(m.fileName, m.type),
            }));
        }

        return res.status(status.CREATED).json({
            success: true,
            message: 'Property shortlisted successfully',
            data,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Property already shortlisted',
            });
        }

        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getMyShortlists = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const filter = {
            userId: req.user.id,
            deletedAt: null,
        };

        const propertySelect = 'title propertyName name price address city state propertyType propertyCategory listingType area measureType media createdAt';

        let query = Shortlist.find(filter)
            .populate({
                path: 'propertyId',
                select: propertySelect,
            })
            .sort({ shortListedAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await Shortlist.countDocuments(filter);

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const shortlists = await query;

        // Map media URLs and filter out null propertyId (deleted properties)
        const data = shortlists
            .map((item) => {
                const shortlistObj = item.toObject();
                
                // If property was deleted but reference exists in shortlist
                if (!shortlistObj.propertyId || typeof shortlistObj.propertyId === 'string') {
                    return null;
                }

                if (shortlistObj.propertyId.media) {
                    shortlistObj.propertyId.media = shortlistObj.propertyId.media.map((m) => ({
                        ...m,
                        url: getPropertyMediaUrl(m.fileName, m.type),
                    }));
                } else {
                    shortlistObj.propertyId.media = [];
                }

                return shortlistObj;
            })
            .filter(Boolean); // Remove null entries

        return res.status(status.OK).json({
            success: true,
            message: 'Shortlisted properties fetched successfully',
            data,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.removeFromShortlist = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        const shortlist = await Shortlist.findOneAndDelete({
            userId,
            propertyId,
            deletedAt: null,
        });

        if (!shortlist) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Shortlist entry not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Property removed from shortlist successfully',
            data: shortlist,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.checkShortlistStatus = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        const shortlist = await Shortlist.findOne({
            userId,
            propertyId,
            deletedAt: null,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Shortlist status fetched successfully',
            data: {
                propertyId,
                isShortlisted: !!shortlist,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

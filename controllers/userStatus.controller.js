const mongoose = require('mongoose');
const Property = require('../models/property.model');
const status = require('../utils/statusCodes');

exports.getMyUserStatus = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const result = await Property.aggregate([
            {
                $match: {
                    ownerId: userId,
                    deletedAt: null,
                },
            },
            {
                $group: {
                    _id: '$ownerId',
                    propertiesListed: { $sum: 1 },
                    verifiedProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$isVerified', true] }, 1, 0],
                        },
                    },
                    soldProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$listingStatus', 'Sold'] }, 1, 0],
                        },
                    },
                    rentedProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$listingStatus', 'Rented'] }, 1, 0],
                        },
                    },
                    activeProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Active'] }, 1, 0],
                        },
                    },
                    pendingProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0],
                        },
                    },
                    rejectedProperties: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0],
                        },
                    },
                },
            },
        ]);

        const data = result[0] || {
            propertiesListed: 0,
            verifiedProperties: 0,
            soldProperties: 0,
            rentedProperties: 0,
            activeProperties: 0,
            pendingProperties: 0,
            rejectedProperties: 0,
        };

        return res.status(status.OK).json({
            success: true,
            message: 'User status fetched successfully',
            data,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getUserStatusByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid user id',
            });
        }

        const ownerFilter = {
            $or: [
                { ownerId: new mongoose.Types.ObjectId(userId) },
                { ownerId: userId },
            ],
            deletedAt: null,
        };

        const propertiesListed = await Property.countDocuments(ownerFilter);

        const saleProperties = await Property.countDocuments({
            ...ownerFilter,
            listingType: 'Sale',
        });

        const rentProperties = await Property.countDocuments({
            ...ownerFilter,
            listingType: 'Rent',
        });

        const activeProperties = await Property.countDocuments({
            ...ownerFilter,
            status: 'Active',
        });

        const inactiveProperties = await Property.countDocuments({
            ...ownerFilter,
            status: 'Inactive',
        });

        return res.status(status.OK).json({
            success: true,
            message: 'User status fetched successfully',
            data: {
                propertiesListed,
                saleProperties,
                rentProperties,
                activeProperties,
                inactiveProperties,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};
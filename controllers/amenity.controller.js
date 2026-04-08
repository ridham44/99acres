const mongoose = require('mongoose');
const Amenity = require('../models/amenity.model');
const status = require('../utils/statusCodes');

exports.createAmenity = async (req, res) => {
    try {
        const { amenityName } = req.body;

        if (!amenityName || !amenityName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'amenityName is required',
            });
        }

        const existingAmenity = await Amenity.findOne({
            amenityName: amenityName.trim(),
            deletedAt: null,
        });

        if (existingAmenity) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Amenity already exists',
            });
        }

        const amenity = await Amenity.create({
            amenityName: amenityName.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Amenity created successfully',
            data: amenity,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAmenities = async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        const filter = { deletedAt: null };

        if (search) {
            filter.amenityName = { $regex: search, $options: 'i' };
        }

        const total = await Amenity.countDocuments(filter);

        let query = Amenity.find(filter).sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);

            query = query.skip((pageNumber - 1) * limitNumber).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const amenities = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Amenities fetched successfully',
            data: amenities,
            pagination,
            meta: {
                totalAmenities: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAmenityById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid amenity id',
            });
        }

        const amenity = await Amenity.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!amenity) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Amenity not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Amenity fetched successfully',
            data: amenity,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateAmenity = async (req, res) => {
    try {
        const { id } = req.params;
        const { amenityName } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid amenity id',
            });
        }

        if (!amenityName || !amenityName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'amenityName is required',
            });
        }

        const amenity = await Amenity.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!amenity) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Amenity not found',
            });
        }

        const existingAmenity = await Amenity.findOne({
            _id: { $ne: id },
            amenityName: amenityName.trim(),
            deletedAt: null,
        });

        if (existingAmenity) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Amenity already exists',
            });
        }

        amenity.amenityName = amenityName.trim();
        amenity.updatedAt = new Date();
        await amenity.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Amenity updated successfully',
            data: amenity,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteAmenity = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid amenity id',
            });
        }

        const amenity = await Amenity.findOneAndUpdate(
            {
                _id: id,
                deletedAt: null,
            },
            {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!amenity) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Amenity not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Amenity deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

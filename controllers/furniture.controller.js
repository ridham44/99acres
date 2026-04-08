const mongoose = require('mongoose');
const Furniture = require('../models/furniture.model');
const status = require('../utils/statusCodes');

exports.createFurniture = async (req, res) => {
    try {
        const { furnitureName } = req.body;

        if (!furnitureName || !furnitureName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'furnitureName is required',
            });
        }

        const existingFurniture = await Furniture.findOne({
            furnitureName: furnitureName.trim(),
            deletedAt: null,
        });

        if (existingFurniture) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Furniture already exists',
            });
        }

        const furniture = await Furniture.create({
            furnitureName: furnitureName.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Furniture created successfully',
            data: furniture,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getFurnitureList = async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        const filter = { deletedAt: null };

        if (search) {
            filter.furnitureName = { $regex: search, $options: 'i' };
        }

        const total = await Furniture.countDocuments(filter);

        let query = Furniture.find(filter).sort({ createdAt: -1 });

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

        const furnitureList = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Furniture fetched successfully',
            data: furnitureList,
            pagination,
            meta: {
                totalFurniture: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getFurnitureById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid furniture id',
            });
        }

        const furniture = await Furniture.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!furniture) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Furniture not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Furniture fetched successfully',
            data: furniture,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateFurniture = async (req, res) => {
    try {
        const { id } = req.params;
        const { furnitureName } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid furniture id',
            });
        }

        if (!furnitureName || !furnitureName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'furnitureName is required',
            });
        }

        const furniture = await Furniture.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!furniture) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Furniture not found',
            });
        }

        const existingFurniture = await Furniture.findOne({
            _id: { $ne: id },
            furnitureName: furnitureName.trim(),
            deletedAt: null,
        });

        if (existingFurniture) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Furniture already exists',
            });
        }

        furniture.furnitureName = furnitureName.trim();
        furniture.updatedAt = new Date();
        await furniture.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Furniture updated successfully',
            data: furniture,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteFurniture = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid furniture id',
            });
        }

        const furniture = await Furniture.findOneAndUpdate(
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

        if (!furniture) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Furniture not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Furniture deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

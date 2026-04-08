const mongoose = require('mongoose');
const NegativeKeyword = require('../models/negativeKeyword.model');
const status = require('../utils/statusCodes');

exports.createNegativeKeyword = async (req, res) => {
    try {
        const { name } = req.body;

        const existingKeyword = await NegativeKeyword.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            deletedAt: null,
        });

        if (existingKeyword) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Negative keyword already exists',
            });
        }

        const negativeKeyword = await NegativeKeyword.create({
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Negative keyword created successfully',
            data: negativeKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllNegativeKeywords = async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        const filter = {
            deletedAt: null,
        };

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        let query = NegativeKeyword.find(filter).sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await NegativeKeyword.countDocuments(filter);

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const negativeKeywords = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Negative keywords fetched successfully',
            data: negativeKeywords,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getNegativeKeywordById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid negative keyword id',
            });
        }

        const negativeKeyword = await NegativeKeyword.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!negativeKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Negative keyword not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Negative keyword fetched successfully',
            data: negativeKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateNegativeKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid negative keyword id',
            });
        }

        const negativeKeyword = await NegativeKeyword.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!negativeKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Negative keyword not found',
            });
        }

        const existingKeyword = await NegativeKeyword.findOne({
            _id: { $ne: id },
            name: { $regex: `^${name}$`, $options: 'i' },
            deletedAt: null,
        });

        if (existingKeyword) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Negative keyword already exists',
            });
        }

        negativeKeyword.name = name;
        negativeKeyword.updatedAt = new Date();

        await negativeKeyword.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Negative keyword updated successfully',
            data: negativeKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteNegativeKeyword = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid negative keyword id',
            });
        }

        const negativeKeyword = await NegativeKeyword.findOneAndUpdate(
            {
                _id: id,
                deletedAt: null,
            },
            {
                $set: {
                    deletedAt: new Date(),
                    updatedAt: new Date(),
                },
            },
            { new: true },
        );

        if (!negativeKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Negative keyword not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Negative keyword deleted successfully',
            data: negativeKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getNegativeKeywordList = async (req, res) => {
    try {
        const negativeKeywords = await NegativeKeyword.find({
            deletedAt: null,
        })
            .select('_id name')
            .sort({ name: 1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Negative keyword list fetched successfully',
            data: negativeKeywords,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

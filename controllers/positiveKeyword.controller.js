const mongoose = require('mongoose');
const PositiveKeyword = require('../models/positiveKeyword.model');
const status = require('../utils/statusCodes');

exports.createPositiveKeyword = async (req, res) => {
    try {
        const { name } = req.body;

        const existingKeyword = await PositiveKeyword.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            deletedAt: null,
        });

        if (existingKeyword) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Positive keyword already exists',
            });
        }

        const positiveKeyword = await PositiveKeyword.create({
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Positive keyword created successfully',
            data: positiveKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAllPositiveKeywords = async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        const filter = {
            deletedAt: null,
        };

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        let query = PositiveKeyword.find(filter).sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await PositiveKeyword.countDocuments(filter);

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const positiveKeywords = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Positive keywords fetched successfully',
            data: positiveKeywords,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPositiveKeywordById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid positive keyword id',
            });
        }

        const positiveKeyword = await PositiveKeyword.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!positiveKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Positive keyword not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Positive keyword fetched successfully',
            data: positiveKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updatePositiveKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid positive keyword id',
            });
        }

        const positiveKeyword = await PositiveKeyword.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!positiveKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Positive keyword not found',
            });
        }

        const existingKeyword = await PositiveKeyword.findOne({
            _id: { $ne: id },
            name: { $regex: `^${name}$`, $options: 'i' },
            deletedAt: null,
        });

        if (existingKeyword) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Positive keyword already exists',
            });
        }

        positiveKeyword.name = name;
        positiveKeyword.updatedAt = new Date();

        await positiveKeyword.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Positive keyword updated successfully',
            data: positiveKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deletePositiveKeyword = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid positive keyword id',
            });
        }

        const positiveKeyword = await PositiveKeyword.findOneAndUpdate(
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

        if (!positiveKeyword) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Positive keyword not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Positive keyword deleted successfully',
            data: positiveKeyword,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPositiveKeywordList = async (req, res) => {
    try {
        const positiveKeywords = await PositiveKeyword.find({
            deletedAt: null,
        })
            .select('_id name')
            .sort({ name: 1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Positive keyword list fetched successfully',
            data: positiveKeywords,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

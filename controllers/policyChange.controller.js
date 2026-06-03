const PolicyChange = require('../models/policyChange.model');
const status = require('../utils/statusCodes');

const buildFilter = (query) => {
    const filter = {};

    if (query.status) {
        filter.status = query.status;
    }

    return filter;
};

exports.createPolicyChange = async (req, res) => {
    try {
        const policyChangeStatus = req.body.status || 'draft';
        const publishedAt = req.body.publishedAt || (policyChangeStatus === 'published' ? new Date() : null);

        const policyChange = await PolicyChange.create({
            title: req.body.title,
            content: req.body.content,
            status: policyChangeStatus,
            publishedAt,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Policy change created successfully',
            data: policyChange,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPolicyChanges = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const filter = buildFilter(req.query);

        const [policyChanges, total] = await Promise.all([
            PolicyChange.find(filter)
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber),
            PolicyChange.countDocuments(filter),
        ]);

        return res.status(status.OK).json({
            success: true,
            message: 'Policy changes fetched successfully',
            data: policyChanges,
            pagination: {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPolicyChangeById = async (req, res) => {
    try {
        const policyChange = await PolicyChange.findById(req.params.id);

        if (!policyChange) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Policy change not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Policy change fetched successfully',
            data: policyChange,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updatePolicyChange = async (req, res) => {
    try {
        const policyChange = await PolicyChange.findById(req.params.id);

        if (!policyChange) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Policy change not found',
            });
        }

        for (const field of ['title', 'content', 'status', 'publishedAt']) {
            if (req.body[field] !== undefined) {
                policyChange[field] = req.body[field];
            }
        }

        if (req.body.status === 'published' && !policyChange.publishedAt) {
            policyChange.publishedAt = new Date();
        }

        if (req.body.status && req.body.status !== 'published' && req.body.publishedAt === undefined) {
            policyChange.publishedAt = null;
        }

        await policyChange.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Policy change updated successfully',
            data: policyChange,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deletePolicyChange = async (req, res) => {
    try {
        const policyChange = await PolicyChange.findByIdAndDelete(req.params.id);

        if (!policyChange) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Policy change not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Policy change permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

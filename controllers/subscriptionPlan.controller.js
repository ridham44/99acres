const SubscriptionPlan = require('../models/subscriptionPlan.model');
const status = require('../utils/statusCodes');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


const buildPlanFilter = (query) => {
    const filter = { deletedAt: null };

    if (query.search) {
        filter.$or = [
            { planName: { $regex: query.search, $options: 'i' } },
            { planDescription: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.isActive !== undefined) {
        filter.isActive = query.isActive;
    }

    return filter;
};

exports.createSubscriptionPlan = async (req, res) => {
    try {
        const existingPlan = await SubscriptionPlan.findOne({
            planName: { $regex: `^${escapeRegex(req.body.planName)}$`, $options: 'i' },
            deletedAt: null,
        });

        if (existingPlan) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Subscription plan already exists',
            });
        }

        const subscriptionPlan = await SubscriptionPlan.create({
            planName: req.body.planName,
            planDescription: req.body.planDescription,
            durationInMonths: req.body.durationInMonths,
            listingVisibilityPercentage: req.body.listingVisibilityPercentage,
            planBenefits: req.body.planBenefits,
            planPrice: req.body.planPrice,
            isActive: req.body.isActive === undefined ? true : req.body.isActive,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Subscription plan created successfully',
            data: subscriptionPlan,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getSubscriptionPlans = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const filter = buildPlanFilter(req.query);

        const total = await SubscriptionPlan.countDocuments(filter);
        let query = SubscriptionPlan.find(filter).sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            query = query.skip((page - 1) * limit).limit(limit);
            pagination = {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }

        const subscriptionPlans = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Subscription plans fetched successfully',
            data: subscriptionPlans,
            pagination,
            meta: {
                totalSubscriptionPlans: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getSubscriptionPlanById = async (req, res) => {
    try {
        const subscriptionPlan = await SubscriptionPlan.findOne({
            _id: req.params.id,
            deletedAt: null,
        });

        if (!subscriptionPlan) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Subscription plan not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Subscription plan fetched successfully',
            data: subscriptionPlan,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateSubscriptionPlan = async (req, res) => {
    try {
        const subscriptionPlan = await SubscriptionPlan.findOne({
            _id: req.params.id,
            deletedAt: null,
        });

        if (!subscriptionPlan) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Subscription plan not found',
            });
        }

        if (req.body.planName !== undefined) {
            const existingPlan = await SubscriptionPlan.findOne({
                _id: { $ne: req.params.id },
                planName: { $regex: `^${escapeRegex(req.body.planName)}$`, $options: 'i' },
                deletedAt: null,
            });

            if (existingPlan) {
                return res.status(status.Conflict).json({
                    success: false,
                    message: 'Subscription plan already exists',
                });
            }
        }

        const updateFields = [
            'planName',
            'planDescription',
            'durationInMonths',
            'listingVisibilityPercentage',
            'planBenefits',
            'planPrice',
            'isActive',
        ];

        updateFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                subscriptionPlan[field] = req.body[field];
            }
        });

        await subscriptionPlan.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Subscription plan updated successfully',
            data: subscriptionPlan,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteSubscriptionPlan = async (req, res) => {
    try {
        const subscriptionPlan = await SubscriptionPlan.findOneAndUpdate(
            {
                _id: req.params.id,
                deletedAt: null,
            },
            {
                $set: {
                    deletedAt: new Date(),
                },
            },
            { new: true },
        );

        if (!subscriptionPlan) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Subscription plan not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Subscription plan deleted successfully',
            data: subscriptionPlan,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

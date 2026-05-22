const SubscriptionPlan = require('../models/subscriptionPlan.model');
const UserSubscription = require('../models/userSubscription.model');
const status = require('../utils/statusCodes');

const addMonths = (date, months) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
};

const expireOldSubscriptions = async (userId) => {
    await UserSubscription.updateMany(
        {
            userId,
            status: 'active',
            endDate: { $lt: new Date() },
            deletedAt: null,
        },
        {
            $set: {
                status: 'expired',
            },
        },
    );
};

exports.getActivePlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({
            isActive: true,
            deletedAt: null,
        })
            .select(
                '_id planName planDescription durationInMonths listingVisibilityPercentage planBenefits planPrice',
            )
            .sort({ planPrice: 1, durationInMonths: 1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Active subscription plans fetched successfully',
            data: plans,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.buySubscriptionPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.body;

        await expireOldSubscriptions(userId);

        const activeSubscription = await UserSubscription.findOne({
            userId,
            status: 'active',
            endDate: { $gte: new Date() },
            deletedAt: null,
        });

        if (activeSubscription) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'You already have an active subscription plan',
                data: activeSubscription,
            });
        }

        const plan = await SubscriptionPlan.findOne({
            _id: planId,
            isActive: true,
            deletedAt: null,
        });

        if (!plan) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Subscription plan not found or inactive',
            });
        }

        const startDate = new Date();
        const endDate = addMonths(startDate, plan.durationInMonths);

        const userSubscription = await UserSubscription.create({
            userId,
            planId: plan._id,
            planName: plan.planName,
            planDescription: plan.planDescription,
            durationInMonths: plan.durationInMonths,
            listingVisibilityPercentage: plan.listingVisibilityPercentage,
            planBenefits: plan.planBenefits,
            planPrice: plan.planPrice,
            startDate,
            endDate,
            status: 'active',
            paymentStatus: 'paid',
            paymentAmount: plan.planPrice,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Subscription plan purchased successfully',
            data: userSubscription,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getMySubscriptions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit, status: subscriptionStatus } = req.query;

        await expireOldSubscriptions(userId);

        const filter = {
            userId,
            deletedAt: null,
        };

        if (subscriptionStatus) {
            filter.status = subscriptionStatus;
        }

        const total = await UserSubscription.countDocuments(filter);
        let query = UserSubscription.find(filter).sort({ createdAt: -1 });
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

        const subscriptions = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'My subscriptions fetched successfully',
            data: subscriptions,
            pagination,
            meta: {
                totalSubscriptions: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getMyActiveSubscription = async (req, res) => {
    try {
        const userId = req.user.id;

        await expireOldSubscriptions(userId);

        const activeSubscription = await UserSubscription.findOne({
            userId,
            status: 'active',
            endDate: { $gte: new Date() },
            deletedAt: null,
        }).sort({ endDate: -1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Active subscription fetched successfully',
            data: activeSubscription,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

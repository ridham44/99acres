const SubscriptionPlan = require('../models/subscriptionPlan.model');
const UserSubscription = require('../models/userSubscription.model');
const PaymentTransaction = require('../models/paymentTransaction.model');
const status = require('../utils/statusCodes');

const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getTargetRole = (userRole) => {
    if (userRole === 'user') return 'user';
    if (userRole === 'broker' || userRole === 'channel_partner') return 'broker_channel_partner';
    if (userRole === 'builder') return 'builder';
    return null;
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
        const userRole = req.user ? req.user.role : null;
        const filter = { isActive: true, deletedAt: null };
        
        if (userRole) {
            const targetRole = getTargetRole(userRole);
            if (targetRole) {
                filter.targetRole = targetRole;
            }
        }

        const plans = await SubscriptionPlan.find(filter)
            .select(
                '_id planName planDescription targetRole pricing listingVisibilityPercentage planBenefits isActive',
            ).sort({ createdAt: -1 });

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
        const { planId, durationInDays } = req.body;

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

        const userRole = req.user ? req.user.role : null;
        const targetRole = getTargetRole(userRole);

        const planQuery = {
            _id: planId,
            isActive: true,
            deletedAt: null,
        };
        if (targetRole) {
            planQuery.targetRole = targetRole;
        }

        const plan = await SubscriptionPlan.findOne(planQuery);

        if (!plan) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Subscription plan not found, inactive, or not applicable for your role',
            });
        }

        const pricingOption = plan.pricing && plan.pricing.find(p => p.durationInDays === Number(durationInDays));
        if (!pricingOption) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid duration selected for this plan',
            });
        }

        const startDate = new Date();
        const endDate = addDays(startDate, pricingOption.durationInDays);

        const userSubscription = await UserSubscription.create({
            userId,
            planId: plan._id,
            planName: plan.planName,
            planDescription: plan.planDescription,
            durationInDays: pricingOption.durationInDays,
            listingVisibilityPercentage: plan.listingVisibilityPercentage,
            planBenefits: plan.planBenefits,
            planPrice: pricingOption.price,
            startDate,
            endDate,
            status: 'active',
            paymentStatus: 'paid',
            paymentAmount: pricingOption.price,
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

        let activeSubscription = await UserSubscription.findOne({
            userId,
            status: 'active',
            endDate: { $gte: new Date() },
            deletedAt: null,
        }).sort({ endDate: -1 });

        // Ensure the associated plan and payment transaction are not deleted
        if (activeSubscription) {
            const userRole = req.user ? req.user.role : null;
            const targetRole = getTargetRole(userRole);

            const planQuery = {
                _id: activeSubscription.planId,
                deletedAt: null,
            };
            if (targetRole) {
                planQuery.targetRole = targetRole;
            }

            const planExists = await SubscriptionPlan.findOne(planQuery);

            const transactionExists = activeSubscription.transactionId
                ? await PaymentTransaction.findById(activeSubscription.transactionId)
                : true;

            if (!planExists || !transactionExists) {
                activeSubscription.status = 'cancelled';
                await activeSubscription.save();
                activeSubscription = null;
            }
        }

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

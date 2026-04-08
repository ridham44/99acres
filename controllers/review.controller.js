const mongoose = require('mongoose');
const Review = require('../models/review.model');
const Property = require('../models/property.model');
const User = require('../models/user.model');
const PositiveKeyword = require('../models/positiveKeyword.model');
const NegativeKeyword = require('../models/negativeKeyword.model');
const status = require('../utils/statusCodes');

exports.createReview = async (req, res) => {
    try {
        const {
            propertyId,
            userType,
            stayDuration,
            connectivity,
            lifestyle,
            safety,
            environment,
            positive,
            negative,
            positiveKeywordIds = [],
            negativeKeywordIds = [],
        } = req.body;

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

        const user = await User.findById(userId);

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const existingReview = await Review.findOne({
            propertyId,
            userId,
            deletedAt: null,
        });

        if (existingReview) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'You have already reviewed this property',
            });
        }

        if (positiveKeywordIds.length > 0) {
            const validPositiveKeywords = await PositiveKeyword.countDocuments({
                _id: { $in: positiveKeywordIds },
                deletedAt: null,
            });

            if (validPositiveKeywords !== positiveKeywordIds.length) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid positive keyword ids',
                });
            }
        }

        if (negativeKeywordIds.length > 0) {
            const validNegativeKeywords = await NegativeKeyword.countDocuments({
                _id: { $in: negativeKeywordIds },
                deletedAt: null,
            });

            if (validNegativeKeywords !== negativeKeywordIds.length) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid negative keyword ids',
                });
            }
        }

        const review = await Review.create({
            propertyId,
            userId,
            name: user.name,
            userType,
            stayDuration,
            connectivity,
            lifestyle,
            safety,
            environment,
            positive,
            negative,
            positiveKeywordIds,
            negativeKeywordIds,
            agreeCount: 0,
            disagreeCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const populatedReview = await Review.findById(review._id)
            .populate('positiveKeywordIds', 'name')
            .populate('negativeKeywordIds', 'name');

        return res.status(status.CREATED).json({
            success: true,
            message: 'Review created successfully',
            data: populatedReview,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getAllReviews = async (req, res) => {
    try {
        const { propertyId, page, limit } = req.query;

        const filter = {
            deletedAt: null,
        };

        if (propertyId) {
            if (!mongoose.Types.ObjectId.isValid(propertyId)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid property id',
                });
            }

            filter.propertyId = propertyId;
        }

        let query = Review.find(filter)
            .populate('positiveKeywordIds', 'name')
            .populate('negativeKeywordIds', 'name')
            .sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            const total = await Review.countDocuments(filter);

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const reviews = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Reviews fetched successfully',
            data: reviews,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPropertyReviewSummary = async (req, res) => {
    try {
        const propertyId = req.params.propertyId || req.query.propertyId;

        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid property id is required',
            });
        }

        const propertyObjectId = new mongoose.Types.ObjectId(propertyId);

        const summaryResult = await Review.aggregate([
            {
                $match: {
                    propertyId: propertyObjectId,
                    deletedAt: null,
                },
            },
            {
                $addFields: {
                    overallRating: {
                        $divide: [
                            {
                                $add: ['$connectivity', '$lifestyle', '$safety', '$environment'],
                            },
                            4,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: '$propertyId',
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$overallRating' },
                    averageConnectivity: { $avg: '$connectivity' },
                    averageLifestyle: { $avg: '$lifestyle' },
                    averageSafety: { $avg: '$safety' },
                    averageEnvironment: { $avg: '$environment' },
                    fiveStar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [{ $gte: ['$overallRating', 4.5] }, { $lte: ['$overallRating', 5] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    fourStar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [{ $gte: ['$overallRating', 3.5] }, { $lt: ['$overallRating', 4.5] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    threeStar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [{ $gte: ['$overallRating', 2.5] }, { $lt: ['$overallRating', 3.5] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    twoStar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [{ $gte: ['$overallRating', 1.5] }, { $lt: ['$overallRating', 2.5] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    oneStar: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [{ $gte: ['$overallRating', 0] }, { $lt: ['$overallRating', 1.5] }],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const positiveKeywordResult = await Review.aggregate([
            {
                $match: {
                    propertyId: propertyObjectId,
                    deletedAt: null,
                },
            },
            {
                $unwind: {
                    path: '$positiveKeywordIds',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $group: {
                    _id: '$positiveKeywordIds',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'positivekeywords',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'keyword',
                },
            },
            {
                $unwind: '$keyword',
            },
            {
                $match: {
                    'keyword.deletedAt': null,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: '$keyword.name',
                    count: 1,
                },
            },
            {
                $sort: {
                    count: -1,
                    name: 1,
                },
            },
        ]);

        const negativeKeywordResult = await Review.aggregate([
            {
                $match: {
                    propertyId: propertyObjectId,
                    deletedAt: null,
                },
            },
            {
                $unwind: {
                    path: '$negativeKeywordIds',
                    preserveNullAndEmptyArrays: false,
                },
            },
            {
                $group: {
                    _id: '$negativeKeywordIds',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'negativekeywords',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'keyword',
                },
            },
            {
                $unwind: '$keyword',
            },
            {
                $match: {
                    'keyword.deletedAt': null,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: '$keyword.name',
                    count: 1,
                },
            },
            {
                $sort: {
                    count: -1,
                    name: 1,
                },
            },
        ]);

        const reviewSummary = summaryResult[0] || {
            totalReviews: 0,
            averageRating: 0,
            averageConnectivity: 0,
            averageLifestyle: 0,
            averageSafety: 0,
            averageEnvironment: 0,
            fiveStar: 0,
            fourStar: 0,
            threeStar: 0,
            twoStar: 0,
            oneStar: 0,
        };

        const totalKeywordMentions = positiveKeywordResult.length + negativeKeywordResult.length;
        const totalPositiveMentions = positiveKeywordResult.reduce((sum, item) => sum + item.count, 0);
        const totalNegativeMentions = negativeKeywordResult.reduce((sum, item) => sum + item.count, 0);
        const totalMentions = totalPositiveMentions + totalNegativeMentions;

        const positiveMentionPercentage = totalMentions ? Number(((totalPositiveMentions / totalMentions) * 100).toFixed(1)) : 0;

        const negativeMentionPercentage = totalMentions ? Number(((totalNegativeMentions / totalMentions) * 100).toFixed(1)) : 0;

        return res.status(status.OK).json({
            success: true,
            message: 'Property review summary fetched successfully',
            data: {
                propertyId,
                totalReviews: reviewSummary.totalReviews,
                averageRating: Number(reviewSummary.averageRating.toFixed(1)),
                ratingsByFeatures: {
                    connectivity: Number(reviewSummary.averageConnectivity.toFixed(1)),
                    lifestyle: Number(reviewSummary.averageLifestyle.toFixed(1)),
                    safety: Number(reviewSummary.averageSafety.toFixed(1)),
                    environment: Number(reviewSummary.averageEnvironment.toFixed(1)),
                },
                ratingDistribution: {
                    fiveStar: reviewSummary.fiveStar,
                    fourStar: reviewSummary.fourStar,
                    threeStar: reviewSummary.threeStar,
                    twoStar: reviewSummary.twoStar,
                    oneStar: reviewSummary.oneStar,
                },
                mentions: {
                    totalKeywords: totalKeywordMentions,
                    totalPositiveMentions,
                    totalNegativeMentions,
                    positiveMentionPercentage,
                    negativeMentionPercentage,
                    likes: positiveKeywordResult,
                    dislikes: negativeKeywordResult,
                },
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

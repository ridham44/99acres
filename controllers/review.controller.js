const mongoose = require("mongoose");
const Review = require("../models/review.model");
const Property = require("../models/property.model");
const User = require("../models/user.model");
const PositiveKeyword = require("../models/positiveKeyword.model");
const NegativeKeyword = require("../models/negativeKeyword.model");
const Inquiry = require("../models/inquiry.model");
const status = require("../utils/statusCodes");

exports.createReview = async (req, res) => {
  try {
    const {
      propertyId,
      name,
      comment,
      rating,
      positiveKeywordIds = [],
      negativeKeywordIds = [],
    } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(status.Unauthorized).json({
        success: false,
        message: "Unauthorized: Please log in to submit a review",
      });
    }

    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid property id",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      deletedAt: null,
    });

    if (!property) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    // Validate that the user is not the owner or dealer of the property
    if (
      property.ownerId.toString() === userId.toString() ||
      (property.dealerId && property.dealerId.toString() === userId.toString())
    ) {
      return res.status(status.Forbidden).json({
        success: false,
        message: "You cannot review your own property",
      });
    }

    // Validate that the user has made an inquiry to this property
    const inquiry = await Inquiry.findOne({
      userId,
      property_id: propertyId,
      deletedAt: null,
    });

    if (!inquiry) {
      return res.status(status.Forbidden).json({
        success: false,
        message: "You can only review properties you have inquired about",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
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
        message: "You have already reviewed this property",
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
          message: "Invalid positive keyword ids",
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
          message: "Invalid negative keyword ids",
        });
      }
    }

    const reviewerName = name && name.trim() ? name.trim() : user.name;

    const review = await Review.create({
      propertyId,
      userId,
      name: reviewerName,
      comment: comment || "",
      rating,
      positiveKeywordIds,
      negativeKeywordIds,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const populatedReview = await Review.findById(review._id)
      .populate("positiveKeywordIds", "name")
      .populate("negativeKeywordIds", "name");

    return res.status(status.CREATED).json({
      success: true,
      message: "Review created successfully",
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
    const { propertyId, page, limit, search, rating } = req.query;

    const filter = {
      deletedAt: null,
    };

    if (propertyId) {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res.status(status.BadRequest).json({
          success: false,
          message: "Invalid property id",
        });
      }

      filter.propertyId = propertyId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    if (rating) {
      const ratingNum = parseFloat(rating);
      // Use a small tolerance range (±0.001) to handle floating-point storage precision
      filter.rating = { $gte: ratingNum - 0.001, $lte: ratingNum + 0.001 };
    }

    let query = Review.find(filter)
      .populate("userId", "name email role")
      .populate("propertyId", "propertyName title price city coverImage")
      .populate("positiveKeywordIds", "name")
      .populate("negativeKeywordIds", "name")
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

    const reviewsData = reviews.map((r) => {
      const doc = r.toObject();
      doc.userRole = r.userId ? r.userId.role : "user";
      doc.userType = r.userId ? r.userId.role : "user";
      return doc;
    });

    return res.status(status.OK).json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviewsData,
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
        message: "Valid property id is required",
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
        $group: {
          _id: "$propertyId",
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          fiveStar: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gte: ["$rating", 4.5] }, { $lte: ["$rating", 5] }],
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
                  $and: [{ $gte: ["$rating", 3.5] }, { $lt: ["$rating", 4.5] }],
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
                  $and: [{ $gte: ["$rating", 2.5] }, { $lt: ["$rating", 3.5] }],
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
                  $and: [{ $gte: ["$rating", 1.5] }, { $lt: ["$rating", 2.5] }],
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
                  $and: [{ $gte: ["$rating", 0] }, { $lt: ["$rating", 1.5] }],
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
          path: "$positiveKeywordIds",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$positiveKeywordIds",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "positivekeywords",
          localField: "_id",
          foreignField: "_id",
          as: "keyword",
        },
      },
      {
        $unwind: "$keyword",
      },
      {
        $match: {
          "keyword.deletedAt": null,
        },
      },
      {
        $project: {
          _id: 1,
          name: "$keyword.name",
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
          path: "$negativeKeywordIds",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$negativeKeywordIds",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "negativekeywords",
          localField: "_id",
          foreignField: "_id",
          as: "keyword",
        },
      },
      {
        $unwind: "$keyword",
      },
      {
        $match: {
          "keyword.deletedAt": null,
        },
      },
      {
        $project: {
          _id: 1,
          name: "$keyword.name",
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
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    };

    const totalKeywordMentions =
      positiveKeywordResult.length + negativeKeywordResult.length;
    const totalPositiveMentions = positiveKeywordResult.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const totalNegativeMentions = negativeKeywordResult.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const totalMentions = totalPositiveMentions + totalNegativeMentions;

    const positiveMentionPercentage = totalMentions
      ? Number(((totalPositiveMentions / totalMentions) * 100).toFixed(1))
      : 0;
    const negativeMentionPercentage = totalMentions
      ? Number(((totalNegativeMentions / totalMentions) * 100).toFixed(1))
      : 0;

    return res.status(status.OK).json({
      success: true,
      message: "Property review summary fetched successfully",
      data: {
        propertyId,
        totalReviews: reviewSummary.totalReviews,
        averageRating: Number((reviewSummary.averageRating || 0).toFixed(1)),
        ratingsByFeatures: {
          connectivity: 0,
          lifestyle: 0,
          safety: 0,
          environment: 0,
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

exports.getPropertyReviewsAndAverage = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid property id",
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
      deletedAt: null,
    });
    if (!property) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    const reviews = await Review.find({ propertyId, deletedAt: null })
      .populate("userId", "role")
      .populate("positiveKeywordIds", "name")
      .populate("negativeKeywordIds", "name")
      .sort({ createdAt: -1 });

    let totalRating = 0;
    let ratingCount = 0;

    reviews.forEach((r) => {
      if (r.rating !== undefined && r.rating !== null) {
        totalRating += r.rating;
        ratingCount++;
      }
    });

    const averageRating =
      ratingCount > 0 ? Number((totalRating / ratingCount).toFixed(2)) : 0;

    const reviewsData = reviews.map((r) => {
      const doc = r.toObject();
      doc.userRole = r.userId ? r.userId.role : "user";
      doc.userType = r.userId ? r.userId.role : "user";
      return doc;
    });

    return res.status(status.OK).json({
      success: true,
      message: "Reviews and average rating fetched successfully",
      data: {
        averageRating,
        totalReviews: reviews.length,
        reviews: reviewsData,
      },
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getMyReviewForProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(status.Unauthorized).json({
        success: false,
        message: "Unauthorized: Please log in",
      });
    }

    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid property id",
      });
    }

    const review = await Review.findOne({
      propertyId,
      userId,
      deletedAt: null,
    })
      .populate("positiveKeywordIds", "name")
      .populate("negativeKeywordIds", "name");

    return res.status(status.OK).json({
      success: true,
      data: review || null,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid review id",
      });
    }

    const review = await Review.findOne({ _id: id, deletedAt: null });

    if (!review) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Review not found or already deleted",
      });
    }

    review.deletedAt = new Date();
    await review.save();

    return res.status(status.OK).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


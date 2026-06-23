const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const validateObjectIdArray = (arr) => {
    if (!Array.isArray(arr)) {
        return false;
    }

    return arr.every((id) => mongoose.Types.ObjectId.isValid(id));
};

exports.validateCreateReview = (req, res, next) => {
    try {
        const {
            propertyId,
            name,
            comment,
            rating,
            positiveKeywordIds = [],
            negativeKeywordIds = [],
        } = req.body;

        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid propertyId is required',
            });
        }

        // Validate new rating field (Required, out of 5)
        if (rating === undefined || rating === null) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Rating is required',
            });
        }
        if (isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Rating must be a number between 1 and 5',
            });
        }

        // Validate name (Required, max 25 characters)
        if (name === undefined || name === null || typeof name !== 'string' || !name.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Name is required',
            });
        }
        if (name.trim().length > 25) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Name must be at most 25 characters long',
            });
        }

        // Validate comment (Required, min 10 and max 100 characters)
        if (comment === undefined || comment === null || typeof comment !== 'string' || comment.trim().length < 10) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Comment is required and must be at least 10 characters long',
            });
        }
        if (comment.trim().length > 100) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Comment must be at most 100 characters long',
            });
        }

        if (!validateObjectIdArray(positiveKeywordIds)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'positiveKeywordIds must be a valid ObjectId array',
            });
        }

        if (!validateObjectIdArray(negativeKeywordIds)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'negativeKeywordIds must be a valid ObjectId array',
            });
        }

        // Sanitize & format req.body
        req.body.name = name.trim();
        req.body.comment = comment.trim();
        req.body.rating = Number(rating);

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

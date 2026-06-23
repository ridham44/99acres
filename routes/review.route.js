const express = require('express');
const controller = require('../controllers/review.controller');
const validation = require('../validation/review.validation');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

const router = express.Router();

router.post('/', auth, validation.validateCreateReview, controller.createReview);
router.get('/', controller.getAllReviews);
router.get('/property/:propertyId/summary', controller.getPropertyReviewSummary);
router.get('/property/:propertyId/my-review', auth, controller.getMyReviewForProperty);
router.get('/property/:propertyId', controller.getPropertyReviewsAndAverage);
router.delete('/:id', auth, admin, controller.deleteReview);

module.exports = router;

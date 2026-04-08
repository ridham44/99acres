const express = require('express');
const controller = require('../controllers/review.controller');
const validation = require('../validation/review.validation');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, validation.validateCreateReview, controller.createReview);
router.get('/', controller.getAllReviews);
router.get('/property/:propertyId/summary', controller.getPropertyReviewSummary);
module.exports = router;

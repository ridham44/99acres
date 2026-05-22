const express = require('express');
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/userSubscription.controller');
const validation = require('../validation/userSubscription.validation');

const router = express.Router();

router.get('/plans', auth, controller.getActivePlans);
router.post('/buy', auth, validation.validateBuySubscriptionPlan, controller.buySubscriptionPlan);
router.get('/my', auth, validation.validateGetMySubscriptions, controller.getMySubscriptions);
router.get('/active', auth, controller.getMyActiveSubscription);

module.exports = router;

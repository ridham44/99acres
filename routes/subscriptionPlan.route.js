const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/subscriptionPlan.controller');
const validation = require('../validation/subscriptionPlan.validation');

const router = express.Router();

router.post('/', auth, admin, validation.validateCreateSubscriptionPlan, controller.createSubscriptionPlan);
router.get('/', auth, admin, validation.validateGetSubscriptionPlans, controller.getSubscriptionPlans);
router.get('/:id', auth, admin, validation.validateSubscriptionPlanId, controller.getSubscriptionPlanById);
router.put('/:id', auth, admin, validation.validateUpdateSubscriptionPlan, controller.updateSubscriptionPlan);
router.delete('/:id', auth, admin, validation.validateSubscriptionPlanId, controller.deleteSubscriptionPlan);

module.exports = router;

const express = require('express');
const controller = require('../controllers/policyChange.controller');
const validation = require('../validation/policyChange.validation');

const router = express.Router();

router.post('/', validation.validateCreatePolicyChange, controller.createPolicyChange);
router.get('/', validation.validateGetPolicyChanges, controller.getPolicyChanges);
router.get('/:id', validation.validatePolicyChangeId, controller.getPolicyChangeById);
router.put('/:id', validation.validateUpdatePolicyChange, controller.updatePolicyChange);
router.delete('/:id', validation.validatePolicyChangeId, controller.deletePolicyChange);

module.exports = router;

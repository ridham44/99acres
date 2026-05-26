const express = require('express');
const router = express.Router();
const requirementController = require('../controllers/requirement.controller');
const protect = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const AGENT_ROLES = ['broker', 'channel_partner', 'builder', 'admin'];

router.post('/', protect, requirementController.createRequirement);
router.get('/my', protect, requirementController.getMyRequirements);
router.get('/all', protect, role(AGENT_ROLES), requirementController.getAllRequirements);
router.get('/:id', protect, requirementController.getRequirementById);
router.get('/:requirementId/matches', protect, requirementController.getMatchedPropertiesForRequirement);
router.put('/:id', protect, requirementController.updateRequirement);
router.patch('/:id/status', protect, requirementController.toggleRequirementStatus);

module.exports = router;

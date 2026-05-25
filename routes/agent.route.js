const express = require('express');
const controller = require('../controllers/agent.controller');
const auth = require('../middleware/auth.middleware');
const uploadAgentImage = require('../utils/agentImageMulter');

const router = express.Router();

router.post('/register', auth, uploadAgentImage.single('companyImage'), controller.createOrUpdateMyAgent);
router.post('/me', auth, uploadAgentImage.single('companyImage'), controller.createOrUpdateMyAgent);
router.get('/around-me/:location', auth, controller.getAgentsAroundMe);

module.exports = router;

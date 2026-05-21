const express = require('express');
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validation = require('../validation/user.validation');

const router = express.Router();

router.get('/profile', authMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, validation.validateUpdateProfile, controller.updateProfile);

module.exports = router;

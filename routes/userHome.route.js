const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/userHome.controller');
const validation = require('../validation/userHome.validation');

router.get('/', auth, validation.validateGetUserHome, controller.getUserHome);

module.exports = router;

const express = require('express');
const controller = require('../controllers/userStatus.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/my', auth, controller.getMyUserStatus);
router.get('/:userId', controller.getUserStatusByUserId);

module.exports = router;

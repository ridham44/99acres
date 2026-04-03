const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');

router.post('/register', controller.register);
router.post('/verify-register-otp', controller.verifyRegisterOtp);
router.post('/login', controller.login);
router.post('/verify-login-otp', controller.verifyLoginOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/logout', auth, controller.logout);
router.get('/log-login', auth, controller.getLogLoginList);

module.exports = router;

const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const uploadUserFiles = require('../utils/profileImageMulter');
const { validateRegister, validateVerifyRegisterOtp, validateLogin, validateVerifyLoginOtp } = require('../validation/auth.validation');

router.post(
    '/register',
    uploadUserFiles.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
    ]),
    validateRegister,
    controller.register,
);
router.post('/verify-register-otp', validateVerifyRegisterOtp, controller.verifyRegisterOtp);
router.post('/login', validateLogin, controller.login);
router.post('/verify-login-otp', validateVerifyLoginOtp, controller.verifyLoginOtp);
router.post('/resend-otp', controller.resendOtp);
router.post('/logout', auth, controller.logout);
router.get('/log-login', auth, controller.getLogLoginList);

module.exports = router;

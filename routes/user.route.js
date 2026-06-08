const express = require('express');
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const validation = require('../validation/user.validation');
const uploadUserFiles = require('../utils/profileImageMulter');

const router = express.Router();

router.get('/profile', authMiddleware, controller.getProfile);
router.put(
    '/profile',
    authMiddleware,
    uploadUserFiles.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'companyLogo', maxCount: 1 },
        { name: 'documents', maxCount: 10 },
    ]),
    validation.validateUpdateProfile,
    controller.updateProfile,
);
router.delete('/profile', authMiddleware, controller.deleteProfile);

module.exports = router;

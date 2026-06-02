const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/propertyNews.controller');
const validation = require('../validation/propertyNews.validation');
const upload = require('../utils/propertyNewsCoverImageMulter');

const router = express.Router();

router.post(
    '/',
    auth,
    admin,
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'images', maxCount: 5 },
    ]),
    validation.validateCreatePropertyNews,
    controller.createPropertyNews
);

router.get('/', validation.validateGetPropertyNews, controller.getPropertyNews);
router.get('/:id', validation.validatePropertyNewsId, controller.getPropertyNewsById);

router.put(
    '/:id',
    auth,
    admin,
    upload.fields([
        { name: 'coverImage', maxCount: 1 },
        { name: 'images', maxCount: 5 },
    ]),
    validation.validateUpdatePropertyNews,
    controller.updatePropertyNews
);

router.delete('/:id', auth, admin, validation.validatePropertyNewsId, controller.deletePropertyNews);

module.exports = router;

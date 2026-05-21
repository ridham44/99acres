const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const controller = require('../controllers/property.controller');
const validation = require('../validation/property.validation');
const auth = require('../middleware/auth.middleware');

router.post(
    '/',
    auth,
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 5 },
    ]),
    validation.validateCreateProperty,
    controller.createProperty,
);

router.get('/', auth, controller.getProperties);
router.get('/:id', auth, validation.validatePropertyId, controller.getPropertyById);
router.put(
    '/:id',
    auth,
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 5 },
    ]),
    validation.validateUpdateProperty,
    controller.updateProperty,
);
router.delete('/:id', auth, validation.validatePropertyId, controller.deleteProperty);

module.exports = router;

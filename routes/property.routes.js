const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const { validatePropertyUploadLimits } = require('../utils/multer');
const controller = require('../controllers/property.controller');
const validation = require('../validation/property.validation');
const auth = require('../middleware/auth.middleware');

router.post(
    '/',
    auth,
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 1 },
        { name: 'brochure', maxCount: 3 },
    ]),
    validatePropertyUploadLimits,
    validation.validateCreateProperty,
    controller.createProperty,
);

router.get('/', auth, controller.getProperties);
router.get('/my-property', auth, controller.myProperty);
router.get('/user/:userId', auth, validation.validateUserId, controller.getPropertiesByUser);

// ── Static-segment routes MUST come before /:id ──────────────────────────────
router.get('/popular', auth, controller.getPopularProperties);
router.get('/count', auth, controller.getPropertyCount);

// ── Property-specific routes ──────────────────────────────────────────────────
router.get('/:id/similar', auth, validation.validatePropertyId, controller.getSimilarProperties);
router.get('/:id/price-trends', auth, validation.validatePropertyId, controller.getPropertyPriceTrends);

router.get('/:id', auth, validation.validatePropertyId, controller.getPropertyById);
router.put(
    '/:id',
    auth,
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'videos', maxCount: 1 },
        { name: 'brochure', maxCount: 3 },
    ]),
    validatePropertyUploadLimits,
    validation.validateUpdateProperty,
    controller.updateProperty,
);
router.delete('/:id', auth, validation.validatePropertyId, controller.deleteProperty);
router.post(
    '/:id/brochure',
    auth,
    validation.validatePropertyId,
    upload.single('brochure'),
    controller.uploadPropertyBrochure
);

module.exports = router;

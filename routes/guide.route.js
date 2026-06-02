const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/guide.controller');
const validation = require('../validation/guide.validation');
const upload = require('../utils/guideCoverImageMulter');

const router = express.Router();

router.post(
    '/admin',
    auth,
    admin,
    upload.single('coverImage'),
    validation.validateCreateGuide,
    controller.createGuide
);

router.get('/admin', auth, admin, validation.validateGetGuides, controller.getAdminGuides);
router.get('/admin/:id', auth, admin, validation.validateGuideId, controller.getAdminGuideById);
router.put(
    '/admin/:id',
    auth,
    admin,
    upload.single('coverImage'),
    validation.validateUpdateGuide,
    controller.updateGuide
);
router.delete('/admin/:id', auth, admin, validation.validateGuideId, controller.deleteGuide);

router.post('/admin/:guideId/chapters', auth, admin, validation.validateGuideParamId, validation.validateCreateChapter, controller.createChapter);
router.get('/admin/:guideId/chapters', auth, admin, validation.validateGuideParamId, controller.getChapters);
router.put('/admin/chapters/:id', auth, admin, validation.validateUpdateChapter, controller.updateChapter);
router.delete('/admin/chapters/:id', auth, admin, validation.validateChildId, controller.deleteChapter);

router.post('/admin/:guideId/takeaways', auth, admin, validation.validateGuideParamId, validation.validateCreateTakeaway, controller.createTakeaway);
router.get('/admin/:guideId/takeaways', auth, admin, validation.validateGuideParamId, controller.getTakeaways);
router.put('/admin/takeaways/:id', auth, admin, validation.validateUpdateTakeaway, controller.updateTakeaway);
router.delete('/admin/takeaways/:id', auth, admin, validation.validateChildId, controller.deleteTakeaway);

router.get('/', validation.validateGetGuides, controller.getGuides);
router.get('/slug/:slug', controller.getGuideBySlug);
router.get('/:id', validation.validateGuideId, controller.getGuideById);

module.exports = router;

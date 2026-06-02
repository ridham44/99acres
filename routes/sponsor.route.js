const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/sponsor.controller');
const validation = require('../validation/sponsor.validation');
const upload = require('../utils/sponsorLogoMulter');

const router = express.Router();

router.post(
    '/admin',
    auth,
    admin,
    upload.single('logo'),
    validation.validateCreateSponsor,
    controller.createSponsor
);

router.get('/admin', auth, admin, validation.validateGetSponsors, controller.getAdminSponsors);
router.get('/admin/:id', auth, admin, validation.validateSponsorId, controller.getAdminSponsorById);
router.put(
    '/admin/:id',
    auth,
    admin,
    upload.single('logo'),
    validation.validateUpdateSponsor,
    controller.updateSponsor
);
router.delete('/admin/:id', auth, admin, validation.validateSponsorId, controller.deleteSponsor);

router.get('/', validation.validateGetSponsors, controller.getSponsors);
router.get('/:id', validation.validateSponsorId, controller.getSponsorById);

module.exports = router;

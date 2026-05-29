const express = require('express');
const controller = require('../controllers/amenity.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const upload = require('../utils/amenityIconMulter');

const router = express.Router();

router.post('/', auth, admin, upload.single('amenityIcon'), controller.createAmenity);
router.get('/', controller.getAmenities);
router.get('/:id', controller.getAmenityById);
router.put('/:id', auth, admin, upload.single('amenityIcon'), controller.updateAmenity);
router.delete('/:id', auth, admin, controller.deleteAmenity);

module.exports = router;


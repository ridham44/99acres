const express = require('express');
const controller = require('../controllers/amenity.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.createAmenity);
router.get('/', controller.getAmenities);
router.get('/:id', controller.getAmenityById);
router.put('/:id', auth, controller.updateAmenity);
router.delete('/:id', auth, controller.deleteAmenity);

module.exports = router;

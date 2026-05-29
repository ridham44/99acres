const express = require('express');
const controller = require('../controllers/nearbyPlace.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const upload = require('../utils/nearbyPlaceIconMulter');

const router = express.Router();

router.post('/', auth, admin, upload.single('placeIcon'), controller.createNearbyPlace);
router.get('/', controller.getNearbyPlaces);
router.get('/:id', controller.getNearbyPlaceById);
router.put('/:id', auth, admin, upload.single('placeIcon'), controller.updateNearbyPlace);
router.delete('/:id', auth, admin, controller.deleteNearbyPlace);

module.exports = router;

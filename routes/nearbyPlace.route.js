const express = require('express');
const controller = require('../controllers/nearbyPlace.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.createNearbyPlace);
router.get('/', controller.getNearbyPlaces);
router.get('/:id', controller.getNearbyPlaceById);
router.put('/:id', auth, controller.updateNearbyPlace);
router.delete('/:id', auth, controller.deleteNearbyPlace);

module.exports = router;

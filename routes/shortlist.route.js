const express = require('express');
const controller = require('../controllers/shortlist.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.addToShortlist);
router.get('/my', auth, controller.getMyShortlists);
router.get('/status/:propertyId', auth, controller.checkShortlistStatus);
router.delete('/:propertyId', auth, controller.removeFromShortlist);

module.exports = router;

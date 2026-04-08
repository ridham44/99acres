const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.route'));
router.use('/user', require('./user.route'));
router.use('/amenities', require('./amenity.route'));
router.use('/furniture', require('./furniture.route'));
router.use('/nearby-places', require('./nearbyPlace.route'));
router.use('/properties', require('./property.routes'));
router.use('/positive-keywords', require('./positiveKeyword.route'));
router.use('/negative-keywords', require('./negativeKeyword.route'));
router.use('/reviews', require('./review.route'));
router.use('/shortlist', require('./shortlist.route'));
router.use('/user-status', require('./userStatus.route'));
router.use('/property-documents', require('./propertyDocument.route'));

module.exports = router;

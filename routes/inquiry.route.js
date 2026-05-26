const express = require('express');
const controller = require('../controllers/inquiry.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/inquiries         — Submit a new inquiry (any logged-in user)
router.post('/', auth, controller.submitInquiry);

// GET  /api/inquiries/received — Owner/dealer sees all inquiries on their properties
router.get('/received', auth, controller.getReceivedInquiries);

// GET  /api/inquiries/status/:propertyId — Check if user already inquired
router.get('/status/:propertyId', auth, controller.checkInquiryStatus);

// GET  /api/inquiries/mycontacts — User sees all inquiries they submitted (with property details)
router.get('/mycontacts', auth, controller.getMyInquiries);

module.exports = router;

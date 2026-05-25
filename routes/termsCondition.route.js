const express = require('express');
const router = express.Router();
const termsConditionController = require('../controllers/termsCondition.controller');
const protect = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const ADMIN_ONLY = ['admin'];

// ── User-side (Public) ───────────────────────────────────────
// Returns the currently active Terms & Conditions
router.get('/', termsConditionController.getActiveTerms);

// ── Admin-side (Protected) ───────────────────────────────────
router.post('/admin', protect, role(ADMIN_ONLY), termsConditionController.createTerms);
router.get('/admin', protect, role(ADMIN_ONLY), termsConditionController.getAllTerms);
router.get('/admin/:id', protect, role(ADMIN_ONLY), termsConditionController.getTermsById);
router.put('/admin/:id', protect, role(ADMIN_ONLY), termsConditionController.updateTerms);
router.delete('/admin/:id', protect, role(ADMIN_ONLY), termsConditionController.deleteTerms);

module.exports = router;

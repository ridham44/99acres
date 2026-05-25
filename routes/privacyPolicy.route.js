const express = require('express');
const router = express.Router();
const privacyPolicyController = require('../controllers/privacyPolicy.controller');
const protect = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

const ADMIN_ONLY = ['admin'];

// ── User-side (Public) ───────────────────────────────────────
// Returns the currently active privacy policy
router.get('/', privacyPolicyController.getActivePrivacyPolicy);

// ── Admin-side (Protected) ───────────────────────────────────
router.post('/admin', protect, role(ADMIN_ONLY), privacyPolicyController.createPrivacyPolicy);
router.get('/admin', protect, role(ADMIN_ONLY), privacyPolicyController.getAllPrivacyPolicies);
router.get('/admin/:id', protect, role(ADMIN_ONLY), privacyPolicyController.getPrivacyPolicyById);
router.put('/admin/:id', protect, role(ADMIN_ONLY), privacyPolicyController.updatePrivacyPolicy);
router.delete('/admin/:id', protect, role(ADMIN_ONLY), privacyPolicyController.deletePrivacyPolicy);

module.exports = router;

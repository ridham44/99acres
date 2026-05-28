const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/admin.controller');
const auth       = require('../middleware/auth.middleware');
const admin      = require('../middleware/admin.middleware');

// All routes below require a valid JWT (auth) AND admin role (admin)

// GET /api/admin/users                   — all users (non-admin roles)
router.get('/users',               auth, admin, controller.getAllUsers);

// GET /api/admin/users/:id               — full user detail + properties
router.get('/users/:id',           auth, admin, controller.getUserDetail);

// GET /api/admin/properties              — all properties across all users
router.get('/properties',          auth, admin, controller.getAllProperties);

// GET /api/admin/requirements            — requirements list with property info
router.get('/requirements',        auth, admin, controller.getRequirements);

// GET /api/admin/requirements/:id        — full requirement detail
router.get('/requirements/:id',    auth, admin, controller.getRequirementById);

// GET /api/admin/inquiries               — inquiries list
router.get('/inquiries',           auth, admin, controller.getInquiries);

module.exports = router;

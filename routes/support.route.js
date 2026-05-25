const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const protect = require("../middleware/auth.middleware");
const admin = require("../middleware/admin.middleware");

/**
 * @route   GET /api/support
 * @desc    Get support contact, topics and FAQs
 * @access  Public
 */
router.get("/", supportController.getSupportData);

/**
 * @route   POST /api/support/ticket
 * @desc    Submit a support ticket
 * @access  Public/Private (Optional User ID)
 */
// Making protect optional if needed, but for now let's assume tickets need auth for tracking
router.post(
  "/ticket",
  (req, res, next) => {
    // Check if token exists, if so use protect, else proceed as guest
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      return protect(req, res, next);
    }
    next();
  },
  supportController.submitTicket,
);

/**
 * @route   Admin CRUD for FAQs
 * @access  Admin
 */
router.get("/admin/faqs", protect, admin, supportController.getAllFAQsAdmin);
router.post("/admin/faqs", protect, admin, supportController.createFAQ);
router.patch("/admin/faqs/:id", protect, admin, supportController.updateFAQ);
router.delete("/admin/faqs/:id", protect, admin, supportController.deleteFAQ);

module.exports = router;

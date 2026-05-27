const express = require("express");
const controller = require("../controllers/builder.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.get("/", controller.getAllBuilders);
router.get("/:id", controller.getBuilderById);

// Protected routes
router.get("/me", auth, controller.getMyBuilder);
router.post("/me", auth, controller.createOrUpdateMyBuilder);
router.delete("/me", auth, controller.deleteMyBuilder);

module.exports = router;

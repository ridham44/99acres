const express = require("express");
const controller = require("../controllers/builder.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes — MUST be defined BEFORE /:id to avoid wildcard interception
router.get("/me", auth, controller.getMyBuilder);
router.post("/me", auth, controller.createOrUpdateMyBuilder);
router.put("/me", auth, controller.createOrUpdateMyBuilder);  // Flutter fallback uses PUT
router.delete("/me", auth, controller.deleteMyBuilder);

// Public routes
router.get("/", controller.getAllBuilders);
router.get("/:id", controller.getBuilderById);

module.exports = router;

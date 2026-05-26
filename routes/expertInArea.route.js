const express = require("express");
const controller = require("../controllers/expertInArea.controller");
const auth = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", auth, controller.createExpertInArea);
router.get("/", controller.getExpertInAreas);
router.get("/:id", controller.getExpertInAreaById);
router.put("/:id", auth, controller.updateExpertInArea);
router.delete("/:id", auth, controller.deleteExpertInArea);

module.exports = router;

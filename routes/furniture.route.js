const express = require('express');
const controller = require('../controllers/furniture.controller');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const upload = require('../utils/furnitureIconMulter');

const router = express.Router();

router.post('/', auth, admin, upload.single('furnitureIcon'), controller.createFurniture);
router.get('/', controller.getFurnitureList);
router.get('/:id', controller.getFurnitureById);
router.put('/:id', auth, admin, upload.single('furnitureIcon'), controller.updateFurniture);
router.delete('/:id', auth, admin, controller.deleteFurniture);

module.exports = router;


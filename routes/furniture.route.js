const express = require('express');
const controller = require('../controllers/furniture.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.createFurniture);
router.get('/', controller.getFurnitureList);
router.get('/:id', controller.getFurnitureById);
router.put('/:id', auth, controller.updateFurniture);
router.delete('/:id', auth, controller.deleteFurniture);

module.exports = router;

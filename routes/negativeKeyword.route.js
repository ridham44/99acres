const express = require('express');
const controller = require('../controllers/negativeKeyword.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.createNegativeKeyword);
router.get('/', controller.getAllNegativeKeywords);
router.get('/list', controller.getNegativeKeywordList);
router.get('/:id', controller.getNegativeKeywordById);
router.put('/:id', auth, controller.updateNegativeKeyword);
router.delete('/:id', auth, controller.deleteNegativeKeyword);

module.exports = router;

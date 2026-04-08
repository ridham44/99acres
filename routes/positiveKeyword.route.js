const express = require('express');
const controller = require('../controllers/positiveKeyword.controller');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', auth, controller.createPositiveKeyword);
router.get('/', controller.getAllPositiveKeywords);
router.get('/list', controller.getPositiveKeywordList);
router.get('/:id', controller.getPositiveKeywordById);
router.put('/:id', auth, controller.updatePositiveKeyword);
router.delete('/:id', auth, controller.deletePositiveKeyword);

module.exports = router;

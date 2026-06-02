const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/bank.controller');
const validation = require('../validation/bank.validation');
const upload = require('../utils/bankIconMulter');

const router = express.Router();

router.post(
    '/',
    auth,
    admin,
    upload.single('bankIcon'),
    validation.validateCreateBank,
    controller.createBank
);

router.get('/', controller.getBanks);

router.delete('/hard-delete/all', auth, admin, controller.hardDeleteAllBanks);

router.get('/:id', validation.validateBankId, controller.getBankById);

router.put(
    '/:id',
    auth,
    admin,
    upload.single('bankIcon'),
    validation.validateUpdateBank,
    controller.updateBank
);

router.delete('/:id', auth, admin, validation.validateBankId, controller.deleteBank);

module.exports = router;

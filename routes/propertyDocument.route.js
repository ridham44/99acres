const express = require('express');
const router = express.Router();

const controller = require('../controllers/propertyDocument.controller');
const validation = require('../validation/propertyDocument.validation');
const auth = require('../middleware/auth.middleware');
const uploadDocument = require('../utils/documentMulter');

router.post(
    '/',
    auth,
    uploadDocument.single('document'),
    validation.validateCreatePropertyDocument,
    controller.createPropertyDocument,
);

router.get('/', auth, controller.getPropertyDocuments);

router.get(
    '/:id',
    auth,
    validation.validatePropertyDocumentId,
    controller.getPropertyDocumentById,
);

router.put(
    '/:id',
    auth,
    uploadDocument.single('document'),
    validation.validateUpdatePropertyDocument,
    controller.updatePropertyDocument,
);

router.delete(
    '/:id',
    auth,
    validation.validatePropertyDocumentId,
    controller.deletePropertyDocument,
);

module.exports = router;
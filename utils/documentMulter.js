const multer = require('multer');

const storage = multer.memoryStorage();

const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
    if (file.fieldname !== 'document') {
        return cb(new Error('Invalid field name. Use document'), false);
    }

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only pdf, jpg, jpeg, png, doc, docx files are allowed'), false);
    }

    cb(null, true);
};

const uploadDocument = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = uploadDocument;

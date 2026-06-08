const multer = require('multer');

const storage = multer.memoryStorage();
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedDocumentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profileImage' && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    if (file.fieldname === 'companyLogo' && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    if (file.fieldname === 'documents' && allowedDocumentTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error('Invalid file. Use profileImage/companyLogo for images or documents for pdf/image/doc/docx files'), false);
};

const uploadUserFiles = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = uploadUserFiles;

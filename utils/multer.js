const multer = require('multer');
const status = require('./statusCodes');

const storage = multer.memoryStorage();

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

const fileFilter = (req, file, cb) => {
    const isImageField = file.fieldname === 'images';
    const isVideoField = file.fieldname === 'videos';

    if (isImageField && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    if (isVideoField && allowedVideoTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error(`Invalid file type for field ${file.fieldname}`), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB per file
    },
});

module.exports = upload;

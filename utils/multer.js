const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'tmp', 'property-uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/\s+/g, '-');
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    },
});

const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
const maxImageSize = 5 * 1024 * 1024;
const maxVideoSize = 50 * 1024 * 1024;

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
        fileSize: maxVideoSize,
    },
});

const deleteUploadedFiles = (files = {}) => {
    Object.values(files)
        .flat()
        .forEach((file) => {
            if (file?.path) {
                fs.promises.unlink(file.path).catch(() => {});
            }
        });
};

const validatePropertyUploadLimits = (req, res, next) => {
    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];

    if (videoFiles.length > 1) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({
            success: false,
            message: 'Only one video is allowed',
        });
    }

    const largeImage = imageFiles.find((file) => file.size > maxImageSize);

    if (largeImage) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({
            success: false,
            message: 'Each image must be 5 MB or less',
        });
    }

    const largeVideo = videoFiles.find((file) => file.size > maxVideoSize);

    if (largeVideo) {
        deleteUploadedFiles(req.files);
        return res.status(400).json({
            success: false,
            message: 'Video must be 50 MB or less',
        });
    }

    res.on('finish', () => {
        deleteUploadedFiles(req.files);
    });

    next();
};

module.exports = upload;
module.exports.validatePropertyUploadLimits = validatePropertyUploadLimits;

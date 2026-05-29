const multer = require('multer');

const storage = multer.memoryStorage();
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'amenityIcon' && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error('Invalid file. Use amenityIcon with jpg/jpeg/png/webp image'), false);
};

const uploadAmenityIcon = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = uploadAmenityIcon;

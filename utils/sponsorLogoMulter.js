const multer = require('multer');

const storage = multer.memoryStorage();
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'logo' && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error('Invalid file. Use logo with jpg/jpeg/png/webp image'), false);
};

const uploadSponsorLogo = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = uploadSponsorLogo;

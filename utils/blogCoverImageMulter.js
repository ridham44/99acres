const multer = require('multer');

const storage = multer.memoryStorage();
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'coverImage' && allowedImageTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    return cb(new Error('Invalid file. Use coverImage with jpg/jpeg/png/webp image'), false);
};

const uploadBlogCoverImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = uploadBlogCoverImage;

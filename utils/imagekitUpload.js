const imagekit = require('../config/imagekit');
const fs = require('fs');

exports.uploadToImagekit = async (file, folder = 'properties') => {
    const originalName = file.originalname.replace(/\s+/g, '-');
    const fileName = `${Date.now()}-${originalName}`;

    try {
        const response = await imagekit.upload({
            file: file.buffer || fs.createReadStream(file.path),
            fileName,
            folder: `/${folder}`,
            useUniqueFileName: false,
        });
        
        return {
            fileName: response.name,
            filePath: response.filePath,
            url: response.url,
            thumbnailUrl: response.thumbnailUrl || null,
            fileType: response.fileType || '',
        };
    } finally {
        if (file.path) {
            fs.promises.unlink(file.path).catch(() => {});
        }
    }
};

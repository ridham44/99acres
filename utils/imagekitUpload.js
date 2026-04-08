const imagekit = require('../config/imagekit');

exports.uploadToImagekit = async (file, folder = 'properties') => {
    const originalName = file.originalname.replace(/\s+/g, '-');
    const fileName = `${Date.now()}-${originalName}`;

    const response = await imagekit.upload({
        file: file.buffer,
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
};
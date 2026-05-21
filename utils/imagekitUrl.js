exports.getImagekitFileUrl = (fileName, folder = 'properties') => {
    if (!fileName) {
        return null;
    }

    return `${process.env.IMAGEKIT_URL_ENDPOINT}/${folder}/${fileName}`;
};

const getPropertyMediaUrl = (fileName, type) => {
    if (!fileName) return null;

    const baseUrl = process.env.IMAGEKIT_URL_ENDPOINT;

    if (type === 'image') {
        return `${baseUrl}/properties/images/${fileName}`;
    }

    if (type === 'video') {
        return `${baseUrl}/properties/videos/${fileName}`;
    }

    return null;
};
const getPropertyDocumentUrl = (fileName) => {
    if (!fileName) return null;
    return `${process.env.IMAGEKIT_URL_ENDPOINT}/properties/documents/${fileName}`;
};

module.exports = {
    getPropertyMediaUrl,
    getPropertyDocumentUrl,
};

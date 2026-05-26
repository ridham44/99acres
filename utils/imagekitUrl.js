const getBaseUrl = () =>
    'https://ik.imagekit.io/aj6cyp5nm';

exports.getImagekitFileUrl = (fileName, folder = 'properties') => {
    if (!fileName) {
        return null;
    }

    return `${getBaseUrl()}/${folder}/${fileName}`;
};

const getPropertyMediaUrl = (fileName, type) => {
    if (!fileName) return null;

    const baseUrl = getBaseUrl();

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
    return `${getBaseUrl()}/properties/documents/${fileName}`;
};

const getUserProfileImageUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/users/profile-images/${fileName}`;
};

const getUserDocumentUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/users/documents/${fileName}`;
};

const getAgentCompanyImageUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/agents/company-images/${fileName}`;
};

module.exports = {
    getImagekitFileUrl: exports.getImagekitFileUrl,
    getPropertyMediaUrl,
    getPropertyDocumentUrl,
    getUserProfileImageUrl,
    getUserDocumentUrl,
    getAgentCompanyImageUrl,
};

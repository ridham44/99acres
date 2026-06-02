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

const getPropertyBrochureUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/properties/brochures/${fileName}`;
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

const getBankIconUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/banks/icons/${fileName}`;
};

const getNearbyPlaceIconUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/nearby-places/icons/${fileName}`;
};

const getAmenityIconUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/amenities/icons/${fileName}`;
};

const getFurnitureIconUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/furniture/icons/${fileName}`;
};

const getBlogCoverImageUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/blogs/covers/${fileName}`;
};

const getPropertyNewsCoverImageUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/property-news/covers/${fileName}`;
};

const getPropertyNewsImageUrl = (fileName) => {
    if (!fileName) return null;
    return `${getBaseUrl()}/property-news/images/${fileName}`;
};

module.exports = {
    getImagekitFileUrl: exports.getImagekitFileUrl,
    getPropertyMediaUrl,
    getPropertyDocumentUrl,
    getPropertyBrochureUrl,
    getUserProfileImageUrl,
    getUserDocumentUrl,
    getAgentCompanyImageUrl,
    getBankIconUrl,
    getNearbyPlaceIconUrl,
    getAmenityIconUrl,
    getFurnitureIconUrl,
    getBlogCoverImageUrl,
    getPropertyNewsCoverImageUrl,
    getPropertyNewsImageUrl,
};



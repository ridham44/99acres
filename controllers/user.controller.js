const User = require('../models/user.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getUserProfileImageUrl, getUserDocumentUrl } = require('../utils/imagekitUrl');

const normalizeDocuments = (documents) => {
    if (!documents) {
        return [];
    }

    if (Array.isArray(documents)) {
        return documents;
    }

    if (typeof documents === 'string') {
        try {
            const parsed = JSON.parse(documents);
            return Array.isArray(parsed) ? parsed : [documents];
        } catch (error) {
            return [documents];
        }
    }

    return [];
};

const formatUserProfile = (user) => {
    const data = typeof user.toObject === 'function' ? user.toObject() : user;

    return {
        ...data,
        profileImageUrl: getUserProfileImageUrl(data.profileImage),
        documentUrls: (data.documents || []).map((fileName) => getUserDocumentUrl(fileName)),
    };
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');

        return res.status(status.OK).json({
            success: true,
            data: formatUserProfile(user),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.documents !== undefined) {
            updateData.documents = normalizeDocuments(updateData.documents);
        }

        if (req.files?.profileImage?.[0]) {
            const uploaded = await uploadToImagekit(req.files.profileImage[0], 'users/profile-images');
            updateData.profileImage = uploaded.fileName;
        }

        if (req.files?.documents?.length) {
            const user = await User.findById(req.user.id).select('documents');
            const documentFileNames = updateData.documents || [...(user?.documents || [])];

            for (const file of req.files.documents) {
                const uploaded = await uploadToImagekit(file, 'users/documents');
                documentFileNames.push(uploaded.fileName);
            }

            updateData.documents = documentFileNames;
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true });

        return res.status(status.OK).json({
            success: true,
            message: 'Profile updated',
            data: formatUserProfile(user),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

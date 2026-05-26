const User = require('../models/user.model');
const Shortlist = require('../models/shortlist.model');
const PropertyVisit = require('../models/propertyVisit.model');
const Property = require('../models/property.model');
const PropertyDocument = require('../models/propertyDocument.model');
const Agent = require('../models/agent.model');
const OTP = require('../models/otp.model');
const Review = require('../models/review.model');
const Requirement = require('../models/requirement.model');
const SupportTicket = require('../models/supportTicket.model');
const UserStatus = require('../models/userStatus.model');
const UserSubscription = require('../models/userSubscription.model');
const LogLogin = require('../models/logLogin');
const Inquiry = require('../models/inquiry.model');
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
        const userId = req.user.id;
        const user = await User.findById(userId).select('-__v');

        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        const [shortlistedCount, propertyViewedCount, contactedCount] = await Promise.all([
            Shortlist.countDocuments({ userId, deletedAt: null }),
            PropertyVisit.countDocuments({ userId }),
            Inquiry.countDocuments({ userId, deletedAt: null }),
        ]);

        const profileData = formatUserProfile(user);

        return res.status(status.OK).json({
            success: true,
            data: {
                ...profileData,
                stats: {
                    shortlisted: shortlistedCount,
                    contacted: contactedCount,
                    propertyViewed: propertyViewedCount,
                },
            },
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

exports.deleteProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'User not found',
            });
        }

        // Cascading delete all user-related data
        await Promise.all([
            // Delete shortlists
            Shortlist.updateMany({ userId }, { deletedAt: new Date() }),
            
            // Delete property visits
            PropertyVisit.deleteMany({ userId }),
            
            // Delete OTPs
            OTP.deleteMany({ userId }),
            
            // Delete reviews
            Review.updateMany({ userId }, { deletedAt: new Date() }),
            
            // Delete requirements
            Requirement.updateMany({ userId }, { deletedAt: new Date() }),
            
            // Delete support tickets
            SupportTicket.updateMany({ userId }, { deletedAt: new Date() }),
            
            // Delete user status
            UserStatus.deleteMany({ userId }),
            
            // Delete user subscriptions
            UserSubscription.deleteMany({ userId }),
            
            // Delete login logs
            LogLogin.deleteMany({ userId }),
            
            // Delete agent profile
            Agent.updateMany({ userId }, { deletedAt: new Date() }),
        ]);

        // Find all properties owned or managed by this user
        const userProperties = await Property.find({
            $or: [{ ownerId: userId }, { dealerId: userId }],
            deletedAt: null,
        });

        // Delete property documents for user's properties
        if (userProperties.length > 0) {
            const propertyIds = userProperties.map(p => p._id);
            await PropertyDocument.updateMany(
                { propertyId: { $in: propertyIds } },
                { deletedAt: new Date() },
            );
        }

        // Soft delete all user's properties
        await Property.updateMany(
            { $or: [{ ownerId: userId }, { dealerId: userId }] },
            { deletedAt: new Date(), updatedAt: new Date() },
        );

        // Soft delete the user account
        const deletedUser = await User.findByIdAndUpdate(
            userId,
            { deletedAt: new Date() },
            { new: true },
        );

        return res.status(status.OK).json({
            success: true,
            message: 'User account and all associated data deleted successfully',
            data: {
                userId: deletedUser._id,
                deletedAt: deletedUser.deletedAt,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

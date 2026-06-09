const mongoose = require("mongoose");
const User = require("../models/user.model");
const Shortlist = require("../models/shortlist.model");
const PropertyVisit = require("../models/propertyVisit.model");
const Property = require("../models/property.model");
const PropertyDocument = require("../models/propertyDocument.model");
const Agent = require("../models/agent.model");
const OTP = require("../models/otp.model");
const Review = require("../models/review.model");
const Requirement = require("../models/requirement.model");
const SupportTicket = require("../models/supportTicket.model");
const UserStatus = require("../models/userStatus.model");
const UserSubscription = require("../models/userSubscription.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const SubscriptionPlan = require("../models/subscriptionPlan.model");
const LogLogin = require("../models/logLogin");
const Inquiry = require("../models/inquiry.model");
const status = require("../utils/statusCodes");
const { uploadToImagekit } = require("../utils/imagekitUpload");
const {
  getUserProfileImageUrl,
  getUserDocumentUrl,
  getAgentCompanyImageUrl,
} = require("../utils/imagekitUrl");

const normalizeDocuments = (documents) => {
  if (!documents) {
    return [];
  }

  if (Array.isArray(documents)) {
    return documents;
  }

  if (typeof documents === "string") {
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
  const data = typeof user.toObject === "function" ? user.toObject() : user;

  return {
    ...data,
    profileImageUrl: getUserProfileImageUrl(data.profileImage),
    documentUrls: (data.documents || []).map((fileName) =>
      getUserDocumentUrl(fileName),
    ),
  };
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-__v");

    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
      });
    }

    const ExpertInArea = require("../models/expertInArea.model");

    const [
      shortlistedCount,
      visitedResult,
      contactedCount,
      expertAreas,
      activeSubscription,
    ] = await Promise.all([
      Shortlist.countDocuments({ userId, deletedAt: null }),
      PropertyVisit.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: "properties",
            localField: "propertyId",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: "$property" },
        { $match: { "property.deletedAt": null } },
        { $count: "count" },
      ]),
      Inquiry.countDocuments({ userId, deletedAt: null }),
      ExpertInArea.find({ userId, deletedAt: null }).select("areaName"),
      UserSubscription.findOne({
        userId,
        status: "active",
        endDate: { $gte: new Date() },
        deletedAt: null,
      }).sort({ endDate: -1 }),
    ]);

    let validActiveSubscription = activeSubscription;

    if (activeSubscription) {
      const userRole = user.role;
      let targetRole = null;
      if (userRole === 'user') targetRole = 'user';
      else if (userRole === 'broker' || userRole === 'channel_partner') targetRole = 'broker_channel_partner';
      else if (userRole === 'builder') targetRole = 'builder';

      const planQuery = {
        _id: activeSubscription.planId,
        deletedAt: null,
      };
      if (targetRole) {
        planQuery.targetRole = targetRole;
      }

      const planExists = await SubscriptionPlan.findOne(planQuery);

      const transactionExists = activeSubscription.transactionId
        ? await PaymentTransaction.findById(activeSubscription.transactionId)
        : true;

      if (!planExists || !transactionExists) {
        activeSubscription.status = "cancelled";
        await activeSubscription.save();
        validActiveSubscription = null;
      }
    }

    const propertyViewedCount = visitedResult[0]?.count || 0;

    const profileData = formatUserProfile(user);

    return res.status(status.OK).json({
      success: true,
      data: {
        ...profileData,
        expertInAreas: expertAreas.map((ea) => ea.areaName),
        stats: {
          shortlisted: shortlistedCount,
          contacted: contactedCount,
          propertyViewed: propertyViewedCount,
        },
        activeSubscription: validActiveSubscription,
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

    // Remove companyLogo from user updateData — it belongs on the Agent model
    delete updateData.companyLogo;

    if (updateData.documents !== undefined) {
      updateData.documents = normalizeDocuments(updateData.documents);
    }

    if (req.files?.profileImage?.[0]) {
      const uploaded = await uploadToImagekit(
        req.files.profileImage[0],
        "users/profile-images",
      );
      updateData.profileImage = uploaded.fileName;
    }

    if (req.files?.documents?.length) {
      const user = await User.findById(req.user.id).select("documents");
      const documentFileNames = updateData.documents || [
        ...(user?.documents || []),
      ];

      for (const file of req.files.documents) {
        const uploaded = await uploadToImagekit(file, "users/documents");
        documentFileNames.push(uploaded.fileName);
      }

      updateData.documents = documentFileNames;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    // Handle companyLogo upload for broker/channel_partner — stored on Agent model
    let companyLogoUrl = null;
    if (
      req.files?.companyLogo?.[0] &&
      ["broker", "channel_partner"].includes(user.role)
    ) {
      const uploaded = await uploadToImagekit(
        req.files.companyLogo[0],
        "agents/company-images",
      );
      const agent = await Agent.findOneAndUpdate(
        { userId: req.user.id },
        { $set: { companyImage: uploaded.fileName, deletedAt: null } },
        { new: true, upsert: true },
      );
      companyLogoUrl = getAgentCompanyImageUrl(agent.companyImage);
    } else {
      // Return the existing companyLogoUrl if available
      const agent = await Agent.findOne({
        userId: req.user.id,
        deletedAt: null,
      }).select("companyImage");
      companyLogoUrl = agent
        ? getAgentCompanyImageUrl(agent.companyImage)
        : null;
    }

    return res.status(status.OK).json({
      success: true,
      message: "Profile updated",
      data: {
        ...formatUserProfile(user),
        companyLogoUrl,
      },
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
        message: "User not found",
      });
    }

    const ExpertInArea = require("../models/expertInArea.model");

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

      // Delete expert areas
      ExpertInArea.updateMany({ userId }, { deletedAt: new Date() }),
    ]);

    // Find all properties owned or managed by this user
    const userProperties = await Property.find({
      $or: [{ ownerId: userId }, { dealerId: userId }],
      deletedAt: null,
    });

    // Delete property documents for user's properties
    if (userProperties.length > 0) {
      const propertyIds = userProperties.map((p) => p._id);
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
      message: "User account and all associated data deleted successfully",
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

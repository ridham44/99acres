const mongoose = require("mongoose");
const Agent = require("../models/agent.model");
const Property = require("../models/property.model");
const User = require("../models/user.model");
const status = require("../utils/statusCodes");
const { uploadToImagekit } = require("../utils/imagekitUpload");
const {
  getUserProfileImageUrl,
  getAgentCompanyImageUrl,
} = require("../utils/imagekitUrl");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPropertyStats = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);
  const ownerOrDealerFilter = {
    deletedAt: null,
    $or: [{ ownerId: objectId }, { dealerId: objectId }],
  };

  const [propertiesListed, verifiedProperties] = await Promise.all([
    Property.countDocuments(ownerOrDealerFilter),
    Property.countDocuments({
      ...ownerOrDealerFilter,
      isVerified: true,
    }),
  ]);

  return {
    propertiesListed,
    verifiedProperties,
  };
};

const formatAgent = async (agent) => {
  const data = typeof agent.toObject === "function" ? agent.toObject() : agent;
  const user = data.userId || null;
  const stats = user?._id
    ? await getPropertyStats(user._id)
    : {
        propertiesListed: data.propertiesListed || 0,
        verifiedProperties: data.verifiedProperties || 0,
      };

  return {
    _id: data._id,
    userId: user?._id || data.userId,
    name: data.name || user?.name || null,
    email: data.email || user?.email || null,
    phone: data.phone || user?.phone || null,
    agencyName: data.agencyName || user?.agencyName || "",
    country: data.country || "India",
    state: data.state || "",
    city: data.city || "",
    profileImageUrl: getUserProfileImageUrl(user?.profileImage),
    propertiesListed: stats.propertiesListed,
    verifiedProperties: stats.verifiedProperties,
    companyImageUrl: getAgentCompanyImageUrl(data.companyImage),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

exports.createOrUpdateMyAgent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({ _id: userId, deletedAt: null });

    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
      });
    }

    if (!["broker", "channel_partner"].includes(user.role)) {
      return res.status(status.Forbidden).json({
        success: false,
        message: "Only broker and channel_partner users can register as agents",
      });
    }

    const existingAgent = await Agent.findOne({ userId, deletedAt: null });
    const isNew = !existingAgent;
    const updateData = {};

    // Basic payload for Register (and also allowed in Update)
    if (req.body.name !== undefined)
      updateData.name = String(req.body.name).trim();
    if (req.body.email !== undefined)
      updateData.email = String(req.body.email).trim().toLowerCase();
    if (req.body["phone number"] !== undefined)
      updateData.phone = String(req.body["phone number"]).trim();
    if (req.body.agency_name !== undefined)
      updateData.agencyName = String(req.body.agency_name).trim();
    if (req.body.country !== undefined)
      updateData.country = String(req.body.country).trim();
    if (req.body.state !== undefined)
      updateData.state = String(req.body.state).trim();
    if (req.body.city !== undefined)
      updateData.city = String(req.body.city).trim();

    // "Rest of it" allowed during Update only
    if (!isNew) {
      if (req.file) {
        const uploaded = await uploadToImagekit(
          req.file,
          "agents/company-images",
        );
        updateData.companyImage = uploaded.fileName;
      }
    }

    // Stats are updated on every request (create or update)
    const stats = await getPropertyStats(userId);
    updateData.propertiesListed = stats.propertiesListed;
    updateData.verifiedProperties = stats.verifiedProperties;
    updateData.deletedAt = null;

    const agent = await Agent.findOneAndUpdate(
      { userId },
      {
        $set: updateData,
        $setOnInsert: { userId },
      },
      {
        new: true,
        upsert: true,
      },
    ).populate("userId", "name profileImage role phone email");

    return res.status(status.OK).json({
      success: true,
      message: "Agent profile saved successfully",
      data: await formatAgent(agent),
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAgentsAroundMe = async (req, res) => {
  try {
    const { location } = req.params;
    const { page, limit } = req.query;

    if (!location || !String(location).trim()) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "location is required",
      });
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;
    const locationRegex = new RegExp(escapeRegex(location.trim()), "i");
    const filter = {
      deletedAt: null,
      $or: [
        { city: locationRegex },
        { state: locationRegex },
        { agencyName: locationRegex },
      ],
    };

    const [agents, total] = await Promise.all([
      Agent.find(filter)
        .populate("userId", "name profileImage role phone email")
        .sort({ propertiesListed: -1, createdAt: -1 })
        .skip(skip)
        .limit(currentLimit),
      Agent.countDocuments(filter),
    ]);

    const data = await Promise.all(agents.map(formatAgent));

    return res.status(status.OK).json({
      success: true,
      message: "Agents fetched successfully",
      data,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

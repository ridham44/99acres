const Builder = require("../models/builder.model");
const User = require("../models/user.model");
const status = require("../utils/statusCodes");

// Create or update builder profile for the logged in user
exports.createOrUpdateMyBuilder = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({ _id: userId, deletedAt: null });

    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "builder") {
      return res.status(status.Forbidden).json({
        success: false,
        message: "Only users with 'builder' role can have a builder profile",
      });
    }

    const { companyDetails } = req.body;

    if (!companyDetails || !companyDetails.companyName) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Company name is required",
      });
    }

    const builderData = {
      userId,
      companyDetails: {
        companyName: companyDetails.companyName,
        groupName: companyDetails.groupName,
        yearEstablished: companyDetails.yearEstablished,
        about: companyDetails.about,
        website: companyDetails.website,
        socialLinks: {
          facebook: companyDetails.socialLinks?.facebook,
          instagram: companyDetails.socialLinks?.instagram,
          linkedin: companyDetails.socialLinks?.linkedin,
        },
      },
      deletedAt: null,
    };

    const builder = await Builder.findOneAndUpdate(
      { userId },
      { $set: builderData },
      { new: true, upsert: true, runValidators: true }
    ).populate("userId", "name email phone role profileImage");

    return res.status(status.OK).json({
      success: true,
      message: "Builder profile saved successfully",
      data: builder,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

// Get current user's builder profile
exports.getMyBuilder = async (req, res) => {
  try {
    const userId = req.user.id;
    const builder = await Builder.findOne({ userId, deletedAt: null }).populate(
      "userId",
      "name email phone role profileImage"
    );

    if (!builder) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Builder profile not found",
      });
    }

    return res.status(status.OK).json({
      success: true,
      data: builder,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

// Get builder profile by ID
exports.getBuilderById = async (req, res) => {
  try {
    const { id } = req.params;
    const builder = await Builder.findOne({ _id: id, deletedAt: null }).populate(
      "userId",
      "name email phone role profileImage"
    );

    if (!builder) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Builder not found",
      });
    }

    return res.status(status.OK).json({
      success: true,
      data: builder,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all builders (public list)
exports.getAllBuilders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { deletedAt: null };

    if (search) {
      query["companyDetails.companyName"] = { $regex: search, $options: "i" };
    }

    const builders = await Builder.find(query)
      .populate("userId", "name email phone role profileImage")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Builder.countDocuments(query);

    return res.status(status.OK).json({
      success: true,
      data: builders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalBuilders: count,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

// Soft delete builder profile
exports.deleteMyBuilder = async (req, res) => {
  try {
    const userId = req.user.id;
    const builder = await Builder.findOneAndUpdate(
      { userId, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!builder) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Builder profile not found",
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: "Builder profile deleted successfully",
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

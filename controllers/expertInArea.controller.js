const mongoose = require("mongoose");
const ExpertInArea = require("../models/expertInArea.model");
const status = require("../utils/statusCodes");

exports.createExpertInArea = async (req, res) => {
  try {
    const { areaName } = req.body;

    if (!areaName || !areaName.trim()) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "areaName is required",
      });
    }

    const trimmedAreaName = areaName.trim();
    // Normalize to Sentence Case (e.g. Ahmedabad)
    const normalizedName = trimmedAreaName.charAt(0).toUpperCase() + trimmedAreaName.slice(1).toLowerCase();

    // Check if this user already registered this active area (case-insensitive check)
    const existingArea = await ExpertInArea.findOne({
      userId: req.user.id,
      areaName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      deletedAt: null,
    });

    if (existingArea) {
      return res.status(status.Conflict).json({
        success: false,
        message: "Expert in area already exists and is active for this user",
      });
    }

    const expertInArea = await ExpertInArea.create({
      userId: req.user.id,
      areaName: normalizedName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(status.CREATED).json({
      success: true,
      message: "Expert in area created successfully",
      data: expertInArea,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getExpertInAreas = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    // Always scope to the logged-in user — a user can only see their own areas
    const filter = {
      userId: req.user.id,
      deletedAt: null,
    };

    if (search) { 
      filter.areaName = { $regex: search.trim(), $options: "i" };
    }

    const total = await ExpertInArea.countDocuments(filter);

    let query = ExpertInArea.find(filter).sort({ createdAt: -1 });

    let pagination = null;

    if (page && limit) {
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      query = query.skip((pageNumber - 1) * limitNumber).limit(limitNumber);

      pagination = {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      };
    }

    const expertInAreas = await query;

    return res.status(status.OK).json({
      success: true,
      message: "Expert in areas fetched successfully",
      data: expertInAreas,
      pagination,
      meta: {
        totalExpertInAreas: total,
      },
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getExpertInAreaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid expert in area id",
      });
    }

    // Ownership check — user can only view their own area records
    const expertInArea = await ExpertInArea.findOne({
      _id: id,
      userId: req.user.id,
      deletedAt: null,
    });

    if (!expertInArea) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Expert in area not found",
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: "Expert in area fetched successfully",
      data: expertInArea,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateExpertInArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { areaName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid expert in area id",
      });
    }

    if (!areaName || !areaName.trim()) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "areaName is required",
      });
    }

    const expertInArea = await ExpertInArea.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!expertInArea) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Expert in area not found",
      });
    }

    // Ownership check — user can only update their own area records
    if (expertInArea.userId.toString() !== req.user.id.toString()) {
      return res.status(status.Forbidden).json({
        success: false,
        message: "You are not authorized to update this expert area",
      });
    }

    const trimmedAreaName = areaName.trim();
    const normalizedName = trimmedAreaName.charAt(0).toUpperCase() + trimmedAreaName.slice(1).toLowerCase();

    // Check if this user already has another ACTIVE area with this name (case-insensitive)
    const existingArea = await ExpertInArea.findOne({
      _id: { $ne: id },
      userId: req.user.id,
      areaName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      deletedAt: null,
    });

    if (existingArea) {
      return res.status(status.Conflict).json({
        success: false,
        message: "You already have an active expert area with this name",
      });
    }

    expertInArea.areaName = normalizedName;
    expertInArea.updatedAt = new Date();
    await expertInArea.save();

    return res.status(status.OK).json({
      success: true,
      message: "Expert in area updated successfully",
      data: expertInArea,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteExpertInArea = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Invalid expert in area id",
      });
    }

    // Ownership check — user can only delete their own area records
    const expertInArea = await ExpertInArea.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!expertInArea) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Expert in area not found or you are not authorized to delete it",
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: "Expert in area deleted successfully",
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};

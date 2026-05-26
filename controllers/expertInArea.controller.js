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

    // Check if an ACTIVE area with the same name exists (case-insensitive check)
    const existingArea = await ExpertInArea.findOne({
      areaName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      deletedAt: null,
    });

    if (existingArea) {
      return res.status(status.Conflict).json({
        success: false,
        message: "Expert in area already exists and is active",
      });
    }

    const expertInArea = await ExpertInArea.create({
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

    const filter = { deletedAt: null };

    if (search) {
      filter.areaName = { $regex: search, $options: "i" };
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

    const trimmedAreaName = areaName.trim();
    const normalizedName = trimmedAreaName.charAt(0).toUpperCase() + trimmedAreaName.slice(1).toLowerCase();

    // Check if another ACTIVE area has this name (case-insensitive)
    const existingArea = await ExpertInArea.findOne({
      _id: { $ne: id },
      areaName: { $regex: new RegExp(`^${normalizedName}$`, "i") },
      deletedAt: null,
    });

    if (existingArea) {
      return res.status(status.Conflict).json({
        success: false,
        message: "Another active expert in area already has this name",
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

    const expertInArea = await ExpertInArea.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!expertInArea) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Expert in area not found",
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

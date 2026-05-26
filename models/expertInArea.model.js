const mongoose = require("mongoose");

const expertInAreaSchema = new mongoose.Schema(
  {
    areaName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: false,
  },
);

module.exports = mongoose.model("ExpertInArea", expertInAreaSchema);

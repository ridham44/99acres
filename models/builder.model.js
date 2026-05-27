const mongoose = require("mongoose");

const builderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    companyDetails: {
      companyName: {
        type: String,
        trim: true,
        required: true,
      },
      groupName: {
        type: String,
        trim: true,
      },
      yearEstablished: {
        type: Number,
      },
      about: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      socialLinks: {
        facebook: {
          type: String,
          trim: true,
        },
        instagram: {
          type: String,
          trim: true,
        },
        linkedin: {
          type: String,
          trim: true,
        },
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Builder", builderSchema);

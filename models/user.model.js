const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "broker", "channel_partner", "builder", "admin"],
      default: "user",
    },

    agencyName: {
      type: String,
      trim: true,
    },

    phone: {  
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      sparse: true,
    },

    city: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
      default: "India",
    },

    documents: [
      {
        type: String,
        trim: true,
      },
    ],

    profileImage: {
      type: String,
      trim: true,
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Cascading delete middleware - handles both direct deletions and through API
userSchema.pre("findByIdAndDelete", async function () {
  const userId = this.getQuery()._id;
  if (userId) {
    await handleUserDeletion(userId);
  }
});

userSchema.pre("deleteOne", async function () {
  const userId = this.getQuery()._id;
  if (userId) {
    await handleUserDeletion(userId);
  }
});

userSchema.pre("deleteMany", async function () {
  const userIds = await mongoose
    .model("User")
    .find(this.getQuery())
    .select("_id");
  for (const user of userIds) {
    await handleUserDeletion(user._id);
  }
});

async function handleUserDeletion(userId) {
  try {
    const Shortlist = mongoose.model("Shortlist");
    const PropertyVisit = mongoose.model("PropertyVisit");
    const OTP = mongoose.model("OTP");
    const Review = mongoose.model("Review");
    const Requirement = mongoose.model("Requirement");
    const SupportTicket = mongoose.model("SupportTicket");
    const UserStatus = mongoose.model("UserStatus");
    const UserSubscription = mongoose.model("UserSubscription");
    const LogLogin = mongoose.model("LogLogin");
    const Agent = mongoose.model("Agent");
    const Property = mongoose.model("Property");
    const PropertyDocument = mongoose.model("PropertyDocument");
    const ExpertInArea = mongoose.model("ExpertInArea");

    // Delete shortlists
    await Shortlist.updateMany({ userId }, { deletedAt: new Date() });

    // Delete property visits
    await PropertyVisit.deleteMany({ userId });

    // Delete OTPs
    await OTP.deleteMany({ userId });

    // Delete reviews
    await Review.updateMany({ userId }, { deletedAt: new Date() });

    // Delete requirements
    await Requirement.updateMany({ userId }, { deletedAt: new Date() });

    // Delete support tickets
    await SupportTicket.updateMany({ userId }, { deletedAt: new Date() });

    // Delete user status
    await UserStatus.deleteMany({ userId });

    // Delete user subscriptions
    await UserSubscription.deleteMany({ userId });

    // Delete login logs
    await LogLogin.deleteMany({ userId });

    // Delete agent profile
    await Agent.updateMany({ userId }, { deletedAt: new Date() });

    // Delete expert in areas
    await ExpertInArea.updateMany({ userId }, { deletedAt: new Date() });

    // Find all properties owned or managed by this user
    const userProperties = await Property.find({
      $or: [{ ownerId: userId }, { dealerId: userId }],
    });

    // Delete property documents for user's properties
    if (userProperties.length > 0) {
      const propertyIds = userProperties.map((p) => p._id);
      await PropertyDocument.updateMany(
        { propertyId: { $in: propertyIds } },
        { deletedAt: new Date() },
      );
    }

    // Delete all user's properties
    await Property.updateMany(
      { $or: [{ ownerId: userId }, { dealerId: userId }] },
      { deletedAt: new Date(), updatedAt: new Date() },
    );
  } catch (error) {
    console.error(`Error cascading delete for user ${userId}:`, error.message);
  }
}

module.exports = mongoose.model("User", userSchema);

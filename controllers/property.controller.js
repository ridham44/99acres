const Property = require("../models/property.model");
const User = require("../models/user.model");
const Amenity = require("../models/amenity.model");
const Bank = require("../models/bank.model");
const Builder = require("../models/builder.model");
const Agent = require("../models/agent.model");
const status = require("../utils/statusCodes");
const { uploadToImagekit } = require("../utils/imagekitUpload");
const {
  getPropertyMediaUrl,
  getUserProfileImageUrl,
  getPropertyBrochureUrl,
  getBankIconUrl,
  getAmenityIconUrl,
  getFurnitureIconUrl,
  getAgentCompanyImageUrl,
} = require("../utils/imagekitUrl");


const { recordPropertyVisit } = require("./userHome.controller");


const formatPropertyCard = (item) => {
  const firstImage = (item.media || []).find(
    (mediaItem) => mediaItem.type === "image",
  );
  const coverImage = item.coverImage || (firstImage
    ? getPropertyMediaUrl(firstImage.fileName, firstImage.type)
    : null);

  return {
    _id: item._id,
    title: item.title || item.propertyName,
    propertyName: item.propertyName,
    propertyType: item.propertyType,
    propertyCategory: item.propertyCategory,
    listingType: item.listingType,
    price: item.price,
    priceUnit: item.priceUnit,
    priceOnRequest: item.priceOnRequest ?? false,
    bhk: item.bhk,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    area: item.area,
    facing: item.facing,
    address: item.address,
    locality: item.locality,
    city_area: item.city_area,
    city: item.city,
    state: item.state,
    status: item.status,
    nearbyLandmarks: item.nearbyLandmarks || [],
    coverImage,
    postedBy:
      item.dealerId || item.ownerId
        ? {
            ...(item.dealerId?._doc ||
              item.dealerId ||
              item.ownerId?._doc ||
              item.ownerId),
            profileImageUrl: getUserProfileImageUrl(
              (item.dealerId || item.ownerId).profileImage,
            ),
            url: getUserProfileImageUrl(
              (item.dealerId || item.ownerId).profileImage,
            ),
          }
        : null,
    createdAt: item.createdAt,
    availableUnits: item.availableUnits || [],
    developer: item.developer || null,
  };
};


const formatLaunchStatusPropertyCard = (item) => {
  const formatted = formatPropertyCard(item);
  return {
    ...formatted,
    isLaunch: item.isLaunch || null,
    launchDateOption: item.launchDateOption || null,
    launchDate: item.launchDate || null,
    preLaunchMonth: item.preLaunchMonth || null,
    preLaunchYear: item.preLaunchYear || null,
  };
};


const formatFullProperty = (item) => {
  if (!item) return null;
  const propertyObj = item.toObject ? item.toObject() : item;

  // add `postedBy` field similar to list response (dealerId || ownerId)
  const postedByData = propertyObj.dealerId || propertyObj.ownerId || null;
  if (postedByData) {
    propertyObj.postedBy = {
      ...postedByData,
      profileImageUrl: getUserProfileImageUrl(postedByData.profileImage),
      url: getUserProfileImageUrl(postedByData.profileImage),
    };
  } else {
    propertyObj.postedBy = null;
  }

  // map media using helper
  propertyObj.media = (propertyObj.media || []).map((mediaItem) => ({
    ...mediaItem,
    url: getPropertyMediaUrl(mediaItem.fileName, mediaItem.type),
  }));

  // map brochure URLs
  propertyObj.brochure = (propertyObj.brochure || []).map((brochureItem) => ({
    ...brochureItem,
    url: getPropertyBrochureUrl(brochureItem.fileName),
  }));

  const firstImage = propertyObj.media.find((mediaItem) => mediaItem.type === "image");
  propertyObj.coverImage = propertyObj.coverImage || firstImage?.url || null;

  propertyObj.amenityIds = (propertyObj.amenityIds || []).map((amenity) => {
    const am = amenity ? (amenity._doc || amenity) : {};
    return {
      ...am,
      amenityIconUrl: am.amenityIcon ? getAmenityIconUrl(am.amenityIcon) : null,
    };
  });

  propertyObj.furnishings = (propertyObj.furnishings || []).map((furnishItem) => {
    const fur = furnishItem.furnishingId ? (furnishItem.furnishingId._doc || furnishItem.furnishingId) : {};
    return {
      furnishingId: {
        ...fur,
        furnitureIconUrl: fur.furnitureIcon ? getFurnitureIconUrl(fur.furnitureIcon) : null,
        quantity: furnishItem.quantity,
      },
    };
  });

  return propertyObj;
};


exports.createProperty = async (req, res) => {
  try {
    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];
    const brochureFiles = req.files?.brochure || [];

    const media = [];

    for (const file of imageFiles) {
      const uploaded = await uploadToImagekit(file, "properties/images");

      media.push({
        type: "image",
        fileName: uploaded.fileName,
      });
    }

    for (const file of videoFiles) {
      const uploaded = await uploadToImagekit(file, "properties/videos");

      media.push({
        type: "video",
        fileName: uploaded.fileName,
      });
    }

    // Upload brochure PDFs to ImageKit
    const brochure = [];
    for (const file of brochureFiles) {
      const uploaded = await uploadToImagekit(file, "properties/brochures");
      brochure.push({
        fileName: uploaded.fileName,
        uploadedAt: new Date(),
      });
    }

    let ownerId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "user" || userRole === "builder") {
      ownerId = userId;
    } else if (userRole === "broker" || userRole === "channel_partner") {
      ownerId = req.body.ownerId || userId;
    } else {
      ownerId = userId;
    }

    // --- Validation for isLaunch (only for builder or channel_partner) ---
    if (userRole === "builder" || userRole === "channel_partner") {
      const { isLaunch, launchDateOption, preLaunchMonth, preLaunchYear } = req.body;

      if (isLaunch) {
        if (!["Launched", "Pre-Launch"].includes(isLaunch)) {
          return res.status(status.BadRequest).json({
            success: false,
            message: "isLaunch must be either 'Launched' or 'Pre-Launch'",
          });
        }

        if (isLaunch === "Launched") {
          if (!launchDateOption || !["today", "yesterday"].includes(launchDateOption)) {
            return res.status(status.BadRequest).json({
              success: false,
              message: "For Launched status, launchDateOption is required and must be 'today' or 'yesterday'",
            });
          }

          let date;
          if (launchDateOption === "today") {
            date = new Date();
          } else {
            date = new Date(Date.now() - 24 * 60 * 60 * 1000);
          }
          req.body.launchDate = date;
          req.body.preLaunchMonth = null;
          req.body.preLaunchYear = null;
        } else if (isLaunch === "Pre-Launch") {
          if (!preLaunchMonth || !preLaunchYear) {
            return res.status(status.BadRequest).json({
              success: false,
              message: "For Pre-Launch status, preLaunchMonth and preLaunchYear are required",
            });
          }
          req.body.launchDate = null;
          req.body.launchDateOption = null;
        }
      }
    }

    // --- Parse Technical Audit Fields (if they come as JSON strings from form-data) ---
    const jsonFields = [
      "nearbyLandmarks",
      "locationCoordinates",
      "keyHighlights",
      "floorPlans",
      "legalCertificates",
      "propWorthInsights",
      "reviewTopics",
      "preLeasedDetails",
      "approvedIndustryTypes",
      "keySpecifications",
      "projectDetails",
      "aboutProject",
      "aboutLocality",
      "aboutDeveloper",
      "topAgents",
      "amenityIds",
      "furnishings",
      "specifications",
      "whyConsider",
      "preels",
      "expertReviews",
      "projectInfo",
      "localityInfo",
      "developerInfo",
      "viewStats",
      "availableUnits",
      "developer",
    ];

    // Only builders and admins can set availableUnits and developer fields
    if (req.user.role !== "builder" && req.user.role !== "admin") {
      delete req.body.availableUnits;
      delete req.body.developer;
    }

    jsonFields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          console.log(`Error parsing ${field}:`, e.message);
        }
      }
    });

    // Normalize availableUnits values: accept `IsCharge` or `isCharge`, coerce extraPrice
    if (req.body.availableUnits && Array.isArray(req.body.availableUnits)) {
      req.body.availableUnits = req.body.availableUnits.map((u) => {
        const raw = u || {};
        const isCharge =
          raw.isCharge === true ||
          raw.isCharge === 'true' ||
          raw.IsCharge === true ||
          raw.IsCharge === 'true'
            ? true
            : false;
        const extraPrice = isCharge ? (raw.extraPrice ? Number(raw.extraPrice) : 0) : null;
        return {
          ...raw,
          isCharge,
          extraPrice,
        };
      });
    }

    const property = await Property.create({
      ...req.body,
      ownerId,
      media,
      brochure,
      createdAt: new Date(),
    });

    const propertyObj = property.toObject();

    propertyObj.media = (propertyObj.media || []).map((item) => ({
      ...item,
      url: getPropertyMediaUrl(item.fileName, item.type),
    }));

    propertyObj.brochure = (propertyObj.brochure || []).map((item) => ({
      ...item,
      url: getPropertyBrochureUrl(item.fileName),
    }));

    return res.status(status.CREATED).json({
      success: true,
      message: "Property created successfully",
      data: propertyObj,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getProperties = async (req, res) => {
  try {
    const {
      search,
      status: propertyStatus,
      locations,
      city,
      locality,
      city_area,
      area,           // area-wise filter: matches city_area or locality (sub-area)
      state,
      listingType,
      propertyCategory,
      propertyTypes,
      propertyType,
      bhk,
      bedrooms,
      bathrooms,
      minBudget,
      maxBudget,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      postedBy,
      saleType,
      furnishing,
      amenities,
      facing,
      minFloor,
      maxFloor,
      ownerId,
      dealerId,
      sortBy,
      page,
      limit,
    } = req.query;

    const filter = { deletedAt: null };

    // 1. Search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { propertyName: { $regex: search, $options: "i" } },
        { propertyType: { $regex: search, $options: "i" } },
        { locality: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Status (Default to Active for public API if not specified)
    if (propertyStatus) {
      filter.status = propertyStatus;
    }

    // 3. Locations (supports list of cities/localities)
    if (locations) {
      const locationArray = Array.isArray(locations)
        ? locations
        : String(locations)
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);

      if (locationArray.length > 0) {
        const locationQueries = locationArray.map((loc) => ({
          $or: [
            { city: { $regex: loc, $options: "i" } },
            { locality: { $regex: loc, $options: "i" } },
            { city_area: { $regex: loc, $options: "i" } },
            { address: { $regex: loc, $options: "i" } },
          ],
        }));

        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: locationQueries });
        } else {
          filter.$or = locationQueries;
        }
      }
    } else {
      // Support legacy individual location fields
      if (city) filter.city = { $regex: city, $options: "i" };
      if (locality) filter.locality = { $regex: locality, $options: "i" };
      if (city_area) filter.city_area = { $regex: city_area, $options: "i" };
      if (state) filter.state = { $regex: state, $options: "i" };
    }

    // 3b. Area-wise filter: narrows results to a specific sub-area/locality
    //     Matches against city_area OR locality (case-insensitive)
    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ city_area: areaRegex }, { locality: areaRegex }] });
    }

    // 4. Listing Type & Category
    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;

    // 5. Property Type (Single or List)
    if (propertyTypes || propertyType) {
      const types = propertyTypes
        ? Array.isArray(propertyTypes)
          ? propertyTypes
          : String(propertyTypes).split(",")
        : [propertyType];
      const cleanTypes = types.map((t) => t.trim()).filter(Boolean);
      if (cleanTypes.length > 0) {
        filter.propertyType = { $in: cleanTypes };
      }
    }

    // 6. BHK / Bedrooms / Bathrooms
    if (bhk) filter.bhk = Number(bhk);
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (bathrooms) filter.bathrooms = Number(bathrooms);

    // 7. Budget / Price Range
    const minP = Number(minBudget || minPrice);
    const maxP = Number(maxBudget || maxPrice);
    if (minP || maxP) {
      filter.price = {};
      if (minP) filter.price.$gte = minP;
      if (maxP) filter.price.$lte = maxP;
    }

    // 8. Area Range
    const minA = Number(minArea);
    const maxA = Number(maxArea);
    if (minA || maxA) {
      filter.area = {};
      if (minA) filter.area.$gte = minA;
      if (maxA) filter.area.$lte = maxA;
    }

    // 9. Furnishing
    if (furnishing) {
      const furnishingArray = Array.isArray(furnishing)
        ? furnishing
        : String(furnishing).split(",");
      const mapping = {
        Furnished: "Yes",
        "Semi-Furnished": "Semi",
        Unfurnished: "No",
      };
      const mappedValues = furnishingArray
        .map((f) => mapping[f.trim()])
        .filter(Boolean);
      if (mappedValues.length > 0) {
        filter.furnished = { $in: mappedValues };
      }
    }

    // 10. Amenities (Look up by name)
    if (amenities) {
      const amenityNames = Array.isArray(amenities)
        ? amenities
        : String(amenities)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
      if (amenityNames.length > 0) {
        const foundAmenities = await Amenity.find({
          amenityName: {
            $in: amenityNames.map((n) => new RegExp(`^${n}$`, "i")),
          },
        }).select("_id");
        if (foundAmenities.length > 0) {
          filter.amenityIds = { $in: foundAmenities.map((a) => a._id) };
        }
      }
    }

    // 11. Facing
    if (facing) {
      const facingArray = Array.isArray(facing)
        ? facing
        : String(facing)
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
      if (facingArray.length > 0) {
        filter.facing = {
          $in: facingArray.map((f) => new RegExp(`^${f}$`, "i")),
        };
      }
    }

    // 12. Floor Levels
    if (minFloor || maxFloor) {
      filter.floor = {};
      const parseFloor = (f) => {
        if (f === "Ground") return 0;
        if (f === "Basement") return -1;
        const match = String(f).match(/\d+/);
        return match ? Number(match[0]) : null;
      };
      const minF = parseFloor(minFloor);
      const maxF = parseFloor(maxFloor);
      if (minF !== null) filter.floor.$gte = minF;
      if (maxF !== null) filter.floor.$lte = maxF;
    }

    // 13. Sale Type (New / Resale)
    if (saleType) {
      const types = Array.isArray(saleType)
        ? saleType
        : String(saleType)
            .split(",")
            .map((s) => s.trim().toLowerCase());
      // Map "new" to properties with age 0 or "New"
      if (types.includes("new") && !types.includes("resale")) {
        filter.propertyAge = {
          $in: ["0", "New", "New Construction", "0-1 Years"],
        };
      } else if (types.includes("resale") && !types.includes("new")) {
        filter.propertyAge = {
          $nin: ["0", "New", "New Construction", "0-1 Years"],
        };
      }
    }

    // 14. Posted By (Agent / Owner / Builder)
    if (postedBy) {
      const posters = Array.isArray(postedBy)
        ? postedBy
        : String(postedBy)
            .split(",")
            .map((p) => p.trim());
      const roles = [];
      if (posters.includes("Owner")) roles.push("user");
      if (posters.includes("Agent")) roles.push("broker", "channel_partner");
      if (posters.includes("Builder")) roles.push("builder");

      if (roles.length > 0) {
        const users = await User.find({ role: { $in: roles } }).select("_id");
        const userIds = users.map((u) => u._id);
        filter.$or = filter.$or || [];
        filter.$or.push({ ownerId: { $in: userIds } });
        filter.$or.push({ dealerId: { $in: userIds } });
      }
    }

    // 15. IDs
    if (ownerId) filter.ownerId = ownerId;
    if (dealerId) filter.dealerId = dealerId;

    // 16. Sort
    let sort = { createdAt: -1 };
    if (sortBy) {
      if (sortBy === "price_asc" || sortBy === "Price (L-H)")
        sort = { price: 1 };
      else if (sortBy === "price_desc" || sortBy === "Price (H-L)")
        sort = { price: -1 };
      else if (sortBy === "oldest") sort = { createdAt: 1 };
      else if (sortBy === "newest" || sortBy === "Most Recent")
        sort = { createdAt: -1 };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select(
          "_id title propertyName propertyType propertyCategory listingType price priceUnit priceOnRequest address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing nearbyLandmarks amenityIds furnishingIds ownership flooring waterSource otherKeyFacilities availableUnits developer",
        )
        .populate("ownerId", "name role profileImage")
        .populate("dealerId", "name role profileImage")
        .sort(sort)
        .skip(skip)
        .limit(currentLimit),
      Property.countDocuments(filter),
    ]);

    const data = properties.map(formatPropertyCard);

    // Strip builder-only fields for non-builder / non-admin roles
      // `availableUnits` and `developer` are visible to all roles in list responses

    const activeBanks = await Bank.find({ deletedAt: null }).sort({ createdAt: -1 });
    const formattedBanks = activeBanks.map((bank) => {
      const bankObj = bank.toObject();
      return {
        ...bankObj,
        bankIconUrl: bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null,
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Properties fetched successfully",
      data,
      banks: formattedBanks,
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


exports.myProperty = async (req, res) => {
  try {
    const {
      search,
      status: propertyStatus,
      listingType,
      propertyCategory,
      propertyType,
      city,
      area,           // area-wise filter: matches city_area or locality
      sortBy,
      page,
      limit,
    } = req.query;

    const userId = req.user.id;

    const filter = {
      deletedAt: null,
      $or: [{ ownerId: userId }, { dealerId: userId }],
    };

    if (search) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { propertyName: { $regex: search, $options: "i" } },
            { propertyType: { $regex: search, $options: "i" } },
            { locality: { $regex: search, $options: "i" } },
            { city_area: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { state: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    if (propertyStatus) {
      filter.status = propertyStatus;
    }

    if (listingType) {
      filter.listingType = listingType;
    }

    if (propertyCategory) {
      filter.propertyCategory = propertyCategory;
    }

    if (propertyType) {
      filter.propertyType = propertyType;
    }

    if (city) filter.city = { $regex: city.trim(), $options: "i" };

    // Area-wise filter for myProperty
    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ city_area: areaRegex }, { locality: areaRegex }] });
    }

    let sort = { createdAt: -1 };

    if (sortBy === "price_asc") {
      sort = { price: 1 };
    } else if (sortBy === "price_desc") {
      sort = { price: -1 };
    } else if (sortBy === "oldest") {
      sort = { createdAt: 1 };
    } else if (sortBy === "newest") {
      sort = { createdAt: -1 };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select(
          "_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing nearbyLandmarks createdAt",
        )
        .populate("ownerId", "name role profileImage")
        .populate("dealerId", "name role profileImage")
        .sort(sort)
        .skip(skip)
        .limit(currentLimit),
      Property.countDocuments(filter),
    ]);

    return res.status(status.OK).json({
      success: true,
      message: "My properties fetched successfully",
      data: properties.map(formatPropertyCard),
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


exports.getPropertiesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, listingType, propertyCategory, propertyType, area, sortBy } =
      req.query;

    const user = await User.findOne({ _id: userId, deletedAt: null }).lean();
    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
      });
    }

    user.profileImageUrl = getUserProfileImageUrl(user.profileImage);

    if (user.role === "builder") {
      const builderProfile = await Builder.findOne({ userId, deletedAt: null }).lean();
      user.builderProfile = builderProfile || null;
    } else if (["broker", "channel_partner"].includes(user.role)) {
      const agentProfile = await Agent.findOne({ userId, deletedAt: null }).lean();
      if (agentProfile) {
        agentProfile.companyImageUrl = getAgentCompanyImageUrl(agentProfile.companyImage);
      }
      user.agentProfile = agentProfile || null;
    }

    const filter = {
      deletedAt: null,
      $or: [{ ownerId: userId }, { dealerId: userId }],
    };

    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;
    if (propertyType) filter.propertyType = propertyType;
    if (req.query.status) filter.status = req.query.status;

    // Area-wise filter for getPropertiesByUser
    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ city_area: areaRegex }, { locality: areaRegex }] });
    }

    let sort = { createdAt: -1 };

    if (sortBy === "price_asc") {
      sort = { price: 1 };
    } else if (sortBy === "price_desc") {
      sort = { price: -1 };
    } else if (sortBy === "oldest") {
      sort = { createdAt: 1 };
    } else if (sortBy === "newest") {
      sort = { createdAt: -1 };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select(
          "_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing nearbyLandmarks createdAt",
        )
        .populate("ownerId", "name role profileImage")
        .populate("dealerId", "name role profileImage")
        .sort(sort)
        .skip(skip)
        .limit(currentLimit),
      Property.countDocuments(filter),
    ]);

    return res.status(status.OK).json({
      success: true,
      message: "User properties fetched successfully",
      user,
      data: properties.map(formatPropertyCard),
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


exports.getLaunchStatusProperties = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page,
      limit,
      listingType,
      propertyCategory,
      propertyType,
      isLaunch,
      status: propertyStatus,
      area,
      sortBy,
    } = req.query;

    const user = await User.findOne({ _id: userId, deletedAt: null }).lean();
    if (!user) {
      return res.status(status.NotFound).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "builder" && user.role !== "channel_partner") {
      return res.status(status.BadRequest).json({
        success: false,
        message: "User must be a builder or channel partner to access Launched Status Flow",
      });
    }

    user.profileImageUrl = getUserProfileImageUrl(user.profileImage);

    if (user.role === "builder") {
      const builderProfile = await Builder.findOne({ userId, deletedAt: null }).lean();
      user.builderProfile = builderProfile || null;
    } else if (user.role === "channel_partner") {
      const agentProfile = await Agent.findOne({ userId, deletedAt: null }).lean();
      if (agentProfile) {
        agentProfile.companyImageUrl = getAgentCompanyImageUrl(agentProfile.companyImage);
      }
      user.agentProfile = agentProfile || null;
    }

    const filter = {
      deletedAt: null,
      $or: [{ ownerId: userId }, { dealerId: userId }],
    };

    if (isLaunch) {
      if (!["Launched", "Pre-Launch"].includes(isLaunch)) {
        return res.status(status.BadRequest).json({
          success: false,
          message: "isLaunch must be either 'Launched' or 'Pre-Launch'",
        });
      }
      filter.isLaunch = isLaunch;
    } else {
      filter.isLaunch = { $in: ["Launched", "Pre-Launch"] };
    }

    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;
    if (propertyType) filter.propertyType = propertyType;
    if (propertyStatus) filter.status = propertyStatus;

    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ city_area: areaRegex }, { locality: areaRegex }] });
    }

    let sort = { createdAt: -1 };

    if (sortBy === "price_asc") {
      sort = { price: 1 };
    } else if (sortBy === "price_desc") {
      sort = { price: -1 };
    } else if (sortBy === "oldest") {
      sort = { createdAt: 1 };
    } else if (sortBy === "newest") {
      sort = { createdAt: -1 };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select(
          "_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing nearbyLandmarks createdAt isLaunch launchDateOption launchDate preLaunchMonth preLaunchYear availableUnits developer",
        )
        .populate("ownerId", "name role profileImage")
        .populate("dealerId", "name role profileImage")
        .sort(sort)
        .skip(skip)
        .limit(currentLimit),
      Property.countDocuments(filter),
    ]);

    return res.status(status.OK).json({
      success: true,
      message: "Launch status properties fetched successfully",
      user,
      data: properties.map(formatLaunchStatusPropertyCard),
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


exports.getPrelaunchedProperties = async (req, res) => {
  try {
    const {
      search,
      status: propertyStatus,
      locations,
      city,
      locality,
      city_area,
      area,           // area-wise filter: matches city_area or locality (sub-area)
      state,
      listingType,
      propertyCategory,
      propertyTypes,
      propertyType,
      bhk,
      bedrooms,
      bathrooms,
      minBudget,
      maxBudget,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      postedBy,
      saleType,
      furnishing,
      amenities,
      facing,
      minFloor,
      maxFloor,
      ownerId,
      dealerId,
      sortBy,
      page,
      limit,
    } = req.query;

    const filter = { 
      deletedAt: null,
      isLaunch: "Pre-Launch"
    };

    // 1. Search
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { propertyName: { $regex: search, $options: "i" } },
        { propertyType: { $regex: search, $options: "i" } },
        { locality: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Status (Default to Active for public API if not specified)
    if (propertyStatus) {
      filter.status = propertyStatus;
    }

    // 3. Locations (supports list of cities/localities)
    if (locations) {
      const locationArray = Array.isArray(locations)
        ? locations
        : String(locations)
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);

      if (locationArray.length > 0) {
        const locationQueries = locationArray.map((loc) => ({
          $or: [
            { city: { $regex: loc, $options: "i" } },
            { locality: { $regex: loc, $options: "i" } },
            { city_area: { $regex: loc, $options: "i" } },
            { address: { $regex: loc, $options: "i" } },
          ],
        }));

        if (filter.$or) {
          filter.$and = filter.$and || [];
          filter.$and.push({ $or: locationQueries });
        } else {
          filter.$or = locationQueries;
        }
      }
    } else {
      // Support legacy individual location fields
      if (city) filter.city = { $regex: city, $options: "i" };
      if (locality) filter.locality = { $regex: locality, $options: "i" };
      if (city_area) filter.city_area = { $regex: city_area, $options: "i" };
      if (state) filter.state = { $regex: state, $options: "i" };
    }

    // 3b. Area-wise filter: narrows results to a specific sub-area/locality
    //     Matches against city_area OR locality (case-insensitive)
    if (area) {
      // const areaRegex = { $regex: area.trim(), $options: "i" };
      const areaRegex = { $regex: `^${area.trim()}$`, $options: "i" };
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ city_area: areaRegex }, { locality: areaRegex }] });
    }

    // 4. Listing Type & Category
    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;

    // 5. Property Type (Single or List)
    if (propertyTypes || propertyType) {
      const types = propertyTypes
        ? Array.isArray(propertyTypes)
          ? propertyTypes
          : String(propertyTypes).split(",")
        : [propertyType];
      const cleanTypes = types.map((t) => t.trim()).filter(Boolean);
      if (cleanTypes.length > 0) {
        filter.propertyType = { $in: cleanTypes };
      }
    }

    // 6. BHK / Bedrooms / Bathrooms
    if (bhk) filter.bhk = Number(bhk);
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (bathrooms) filter.bathrooms = Number(bathrooms);

    // 7. Budget / Price Range
    const minP = Number(minBudget || minPrice);
    const maxP = Number(maxBudget || maxPrice);
    if (minP || maxP) {
      filter.price = {};
      if (minP) filter.price.$gte = minP;
      if (maxP) filter.price.$lte = maxP;
    }

    // 8. Area Range
    const minA = Number(minArea);
    const maxA = Number(maxArea);
    if (minA || maxA) {
      filter.area = {};
      if (minA) filter.area.$gte = minA;
      if (maxA) filter.area.$lte = maxA;
    }

    // 9. Furnishing
    if (furnishing) {
      const furnishingArray = Array.isArray(furnishing)
        ? furnishing
        : String(furnishing).split(",");
      const mapping = {
        Furnished: "Yes",
        "Semi-Furnished": "Semi",
        Unfurnished: "No",
      };
      const mappedValues = furnishingArray
        .map((f) => mapping[f.trim()])
        .filter(Boolean);
      if (mappedValues.length > 0) {
        filter.furnished = { $in: mappedValues };
      }
    }

    // 10. Amenities (Look up by name)
    if (amenities) {
      const amenityNames = Array.isArray(amenities)
        ? amenities
        : String(amenities)
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
      if (amenityNames.length > 0) {
        const foundAmenities = await Amenity.find({
          amenityName: {
            $in: amenityNames.map((n) => new RegExp(`^${n}$`, "i")),
          },
        }).select("_id");
        if (foundAmenities.length > 0) {
          filter.amenityIds = { $in: foundAmenities.map((a) => a._id) };
        }
      }
    }

    // 11. Facing
    if (facing) {
      const facingArray = Array.isArray(facing)
        ? facing
        : String(facing)
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
      if (facingArray.length > 0) {
        filter.facing = {
          $in: facingArray.map((f) => new RegExp(`^${f}$`, "i")),
        };
      }
    }

    // 12. Floor Levels
    if (minFloor || maxFloor) {
      filter.floor = {};
      const parseFloor = (f) => {
        if (f === "Ground") return 0;
        if (f === "Basement") return -1;
        const match = String(f).match(/\d+/);
        return match ? Number(match[0]) : null;
      };
      const minF = parseFloor(minFloor);
      const maxF = parseFloor(maxFloor);
      if (minF !== null) filter.floor.$gte = minF;
      if (maxF !== null) filter.floor.$lte = maxF;
    }

    // 13. Sale Type (New / Resale)
    if (saleType) {
      const types = Array.isArray(saleType)
        ? saleType
        : String(saleType)
            .split(",")
            .map((s) => s.trim().toLowerCase());
      // Map "new" to properties with age 0 or "New"
      if (types.includes("new") && !types.includes("resale")) {
        filter.propertyAge = {
          $in: ["0", "New", "New Construction", "0-1 Years"],
        };
      } else if (types.includes("resale") && !types.includes("new")) {
        filter.propertyAge = {
          $nin: ["0", "New", "New Construction", "0-1 Years"],
        };
      }
    }

    // 14. Posted By (Agent / Owner / Builder)
    if (postedBy) {
      const posters = Array.isArray(postedBy)
        ? postedBy
        : String(postedBy)
            .split(",")
            .map((p) => p.trim());
      const roles = [];
      if (posters.includes("Owner")) roles.push("user");
      if (posters.includes("Agent")) roles.push("broker", "channel_partner");
      if (posters.includes("Builder")) roles.push("builder");

      if (roles.length > 0) {
        const users = await User.find({ role: { $in: roles } }).select("_id");
        const userIds = users.map((u) => u._id);
        filter.$or = filter.$or || [];
        filter.$or.push({ ownerId: { $in: userIds } });
        filter.$or.push({ dealerId: { $in: userIds } });
      }
    }

    // 15. IDs
    if (ownerId) filter.ownerId = ownerId;
    if (dealerId) filter.dealerId = dealerId;

    // 16. Sort
    let sort = { createdAt: -1 };
    if (sortBy) {
      if (sortBy === "price_asc" || sortBy === "Price (L-H)")
        sort = { price: 1 };
      else if (sortBy === "price_desc" || sortBy === "Price (H-L)")
        sort = { price: -1 };
      else if (sortBy === "oldest") sort = { createdAt: 1 };
      else if (sortBy === "newest" || sortBy === "Most Recent")
        sort = { createdAt: -1 };
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("ownerId", "name email phone role profileImage")
        .populate("dealerId", "name email phone role profileImage")
        .populate("amenityIds", "amenityName amenityIcon")
        .populate("furnishings.furnishingId", "furnitureName furnitureIcon")
        .sort(sort)
        .skip(skip)
        .limit(currentLimit),
      Property.countDocuments(filter),
    ]);

    const data = properties.map(formatFullProperty);

    const activeBanks = await Bank.find({ deletedAt: null }).sort({ createdAt: -1 });
    const formattedBanks = activeBanks.map((bank) => {
      const bankObj = bank.toObject();
      return {
        ...bankObj,
        bankIconUrl: bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null,
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Pre-Launch properties fetched successfully",
      data,
      banks: formattedBanks,
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


exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({
      _id: id,
      deletedAt: null,
    })
      .populate("ownerId", "name email phone role profileImage")
      .populate("dealerId", "name email phone role profileImage")
      .populate("amenityIds", "amenityName amenityIcon")
      .populate("furnishings.furnishingId", "furnitureName furnitureIcon");


    if (!property) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    try {
      await recordPropertyVisit(req.user.id, id);
    } catch (visitError) {
      console.log("PROPERTY VISIT TRACKING ERROR:", visitError.message);
    }

    const propertyObj = property.toObject();

    // add `postedBy` field similar to list response (dealerId || ownerId)
    const postedByData = propertyObj.dealerId || propertyObj.ownerId || null;
    if (postedByData) {
      propertyObj.postedBy = {
        ...postedByData,
        profileImageUrl: getUserProfileImageUrl(postedByData.profileImage),
        url: getUserProfileImageUrl(postedByData.profileImage),
      };
    } else {
      propertyObj.postedBy = null;
    }

    // ✅ map media using helper
    propertyObj.media = (propertyObj.media || []).map((item) => ({
      ...item,
      url: getPropertyMediaUrl(item.fileName, item.type),
    }));

    // map brochure URLs
    propertyObj.brochure = (propertyObj.brochure || []).map((item) => ({
      ...item,
      url: getPropertyBrochureUrl(item.fileName),
    }));

    const firstImage = propertyObj.media.find((item) => item.type === "image");
    propertyObj.coverImage = propertyObj.coverImage || firstImage?.url || null;

    propertyObj.amenityIds = (propertyObj.amenityIds || []).map((amenity) => {
      const am = amenity ? (amenity._doc || amenity) : {};
      return {
        ...am,
        amenityIconUrl: am.amenityIcon ? getAmenityIconUrl(am.amenityIcon) : null,
      };
    });

    propertyObj.furnishings = (propertyObj.furnishings || []).map((item) => {
      const fur = item.furnishingId ? (item.furnishingId._doc || item.furnishingId) : {};
      return {
        furnishingId: {
          ...fur,
          furnitureIconUrl: fur.furnitureIcon ? getFurnitureIconUrl(fur.furnitureIcon) : null,
          quantity: item.quantity,
        },
      };
    });

    // Role-based filtering for sensitive builder fields
      // `availableUnits` and `developer` are visible to all roles in detail responses

    const activeBanks = await Bank.find({ deletedAt: null }).sort({ createdAt: -1 });
    propertyObj.banks = activeBanks.map((bank) => {
      const bankObj = bank.toObject();
      return {
        ...bankObj,
        bankIconUrl: bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null,
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Property fetched successfully",
      data: propertyObj,
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProperty = await Property.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingProperty) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    // --- Parse Technical Audit Fields (if they come as JSON strings from form-data) ---
    const jsonFields = [
      "nearbyLandmarks",
      "locationCoordinates",
      "keyHighlights",
      "floorPlans",
      "legalCertificates",
      "propWorthInsights",
      "reviewTopics",
      "preLeasedDetails",
      "approvedIndustryTypes",
      "keySpecifications",
      "projectDetails",
      "aboutProject",
      "aboutLocality",
      "aboutDeveloper",
      "topAgents",
      "amenityIds",
      "furnishings",
      "specifications",
      "whyConsider",
      "preels",
      "expertReviews",
      "projectInfo",
      "localityInfo",
      "developerInfo",
      "viewStats",
      "availableUnits",
      "developer",
    ];

    // Only builders and admins can set availableUnits and developer fields
    if (req.user.role !== "builder" && req.user.role !== "admin") {
      delete req.body.availableUnits;
      delete req.body.developer;
    }

    // --- Validation for isLaunch (only for builder or channel_partner) ---
    const userRole = req.user.role;
    if (userRole === "builder" || userRole === "channel_partner") {
      const { isLaunch, launchDateOption, preLaunchMonth, preLaunchYear } = req.body;

      if (isLaunch) {
        if (!["Launched", "Pre-Launch"].includes(isLaunch)) {
          return res.status(status.BadRequest).json({
            success: false,
            message: "isLaunch must be either 'Launched' or 'Pre-Launch'",
          });
        }

        if (isLaunch === "Launched") {
          if (!launchDateOption || !["today", "yesterday"].includes(launchDateOption)) {
            return res.status(status.BadRequest).json({
              success: false,
              message: "For Launched status, launchDateOption is required and must be 'today' or 'yesterday'",
            });
          }

          let date;
          if (launchDateOption === "today") {
            date = new Date();
          } else {
            date = new Date(Date.now() - 24 * 60 * 60 * 1000);
          }
          req.body.launchDate = date;
          req.body.preLaunchMonth = null;
          req.body.preLaunchYear = null;
        } else if (isLaunch === "Pre-Launch") {
          if (!preLaunchMonth || !preLaunchYear) {
            return res.status(status.BadRequest).json({
              success: false,
              message: "For Pre-Launch status, preLaunchMonth and preLaunchYear are required",
            });
          }
          req.body.launchDate = null;
          req.body.launchDateOption = null;
        }
      }
    }

    jsonFields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          console.log(`Error parsing ${field}:`, e.message);
        }
      }
    });

    // Normalize availableUnits values on update as well
    if (req.body.availableUnits && Array.isArray(req.body.availableUnits)) {
      req.body.availableUnits = req.body.availableUnits.map((u) => {
        const raw = u || {};
        const isCharge =
          raw.isCharge === true ||
          raw.isCharge === 'true' ||
          raw.IsCharge === true ||
          raw.IsCharge === 'true'
            ? true
            : false;
        const extraPrice = isCharge ? (raw.extraPrice ? Number(raw.extraPrice) : 0) : null;
        return {
          ...raw,
          isCharge,
          extraPrice,
        };
      });
    }

    const imageFiles = req.files?.images || [];
    const videoFiles = req.files?.videos || [];
    const brochureFiles = req.files?.brochure || [];
    const coverImageFile = req.files?.coverImage?.[0];

    if (coverImageFile) {
      const uploaded = await uploadToImagekit(coverImageFile, "properties/images");
      req.body.coverImage = getPropertyMediaUrl(uploaded.fileName, "image");
    }

    let media = existingProperty.media || [];

    if (videoFiles.length > 0) {
      media = media.filter((item) => item.type !== "video");
    }

    for (const file of imageFiles) {
      const uploaded = await uploadToImagekit(file, "properties/images");

      media.push({
        fileName: uploaded.fileName,
        type: "image",
        uploadedAt: new Date(),
      });
    }

    for (const file of videoFiles) {
      const uploaded = await uploadToImagekit(file, "properties/videos");

      media.push({
        fileName: uploaded.fileName,
        type: "video",
        uploadedAt: new Date(),
      });
    }

    // Append new brochure PDFs (existing ones are kept)
    let brochure = existingProperty.brochure || [];
    for (const file of brochureFiles) {
      const uploaded = await uploadToImagekit(file, "properties/brochures");
      brochure.push({
        fileName: uploaded.fileName,
        uploadedAt: new Date(),
      });
    }

    const property = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        ...req.body,
        media,
        brochure,
        updatedAt: new Date(),
      },
      { new: true },
    )
      .populate("ownerId", "name email phone role profileImage")
      .populate("dealerId", "name email phone role profileImage")
      .populate("amenityIds", "amenityName amenityIcon")
      .populate("furnishings.furnishingId", "furnitureName furnitureIcon");


    const propertyObj = property.toObject();

    // add `postedBy` field
    const postedByData = propertyObj.dealerId || propertyObj.ownerId || null;
    if (postedByData) {
      propertyObj.postedBy = {
        ...postedByData,
        profileImageUrl: getUserProfileImageUrl(postedByData.profileImage),
        url: getUserProfileImageUrl(postedByData.profileImage),
      };
    } else {
      propertyObj.postedBy = null;
    }

    // map media URLs (same as getPropertyById)
    propertyObj.media = (propertyObj.media || []).map((item) => ({
      ...item,
      url: getPropertyMediaUrl(item.fileName, item.type),
    }));

    // map brochure URLs
    propertyObj.brochure = (propertyObj.brochure || []).map((item) => ({
      ...item,
      url: getPropertyBrochureUrl(item.fileName),
    }));

    const firstImage = propertyObj.media.find((item) => item.type === "image");
    propertyObj.coverImage = propertyObj.coverImage || firstImage?.url || null;

    propertyObj.amenityIds = (propertyObj.amenityIds || []).map((amenity) => {
      const am = amenity ? (amenity._doc || amenity) : {};
      return {
        ...am,
        amenityIconUrl: am.amenityIcon ? getAmenityIconUrl(am.amenityIcon) : null,
      };
    });

    propertyObj.furnishings = (propertyObj.furnishings || []).map((item) => {
      const fur = item.furnishingId ? (item.furnishingId._doc || item.furnishingId) : {};
      return {
        furnishingId: {
          ...fur,
          furnitureIconUrl: fur.furnitureIcon ? getFurnitureIconUrl(fur.furnitureIcon) : null,
          quantity: item.quantity,
        },
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Property updated successfully",
      data: propertyObj,
    });
  } catch (error) {
    console.log("UPDATE PROPERTY ERROR:", error);

    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!property) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    return res.status(status.OK).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


// ─── GET /api/properties/:id/similar ─────────────────────────────────────────
exports.getSimilarProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const source = await Property.findOne({ _id: id, deletedAt: null }).select(
      "propertyCategory propertyType city bhk bedrooms price",
    );

    if (!source) {
      return res
        .status(status.NotFound)
        .json({ success: false, message: "Property not found" });
    }

    const filter = {
      _id: { $ne: id },
      deletedAt: null,
      status: "Active",
      propertyCategory: source.propertyCategory,
      city: source.city,
    };

    if (source.propertyType) filter.propertyType = source.propertyType;

    const props = await Property.find(filter)
      .select(
        "_id title propertyName propertyType propertyCategory listingType price area bhk bedrooms status propertyAge locality city coverImage media",
      )
      .limit(Number(limit));

    const data = props.map((p) => {
      const firstImage = (p.media || []).find((m) => m.type === "image");
      return {
        propertyId: p._id,
        title: p.title || p.propertyName,
        location: [p.locality, p.city].filter(Boolean).join(", "),
        price: p.price,
        pricePerSqft: p.area > 0 ? Math.round(p.price / p.area) : null,
        bhk: p.bhk || p.bedrooms,
        propertyType: p.propertyType,
        status: p.status,
        propertyAge: p.propertyAge || null,
        coverImage: firstImage
          ? getPropertyMediaUrl(firstImage.fileName, "image")
          : p.coverImage || null,
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Similar properties fetched successfully",
      data,
    });
  } catch (error) {
    return res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};


// ─── GET /api/properties/:id/price-trends ───────────────────────────────────
exports.getPropertyPriceTrends = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findOne({
      _id: id,
      deletedAt: null,
    }).select("propertyName propWorthInsights locality");

    if (!property) {
      return res
        .status(status.NotFound)
        .json({ success: false, message: "Property not found" });
    }

    const insights = property.propWorthInsights || {};

    // Build trend arrays with generated date labels
    const buildTrend = (values = [], timeframe = "1Y") => {
      if (!values.length) return [];
      const now = new Date();
      return values.map((pricePerSqft, i) => {
        const d = new Date(now);
        d.setMonth(
          d.getMonth() -
            (values.length - 1 - i) *
              (timeframe === "3M" ? 1 : timeframe === "6M" ? 1 : 2),
        );
        return {
          date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
          pricePerSqft,
        };
      });
    };

    return res.status(status.OK).json({
      success: true,
      message: "Price trends fetched successfully",
      data: {
        localityName: insights.currentLocality || property.locality,
        projectName: property.propertyName,
        timeframe: insights.timeframe || "1Y",
        projectPriceTrend: buildTrend(
          insights.projectTrend,
          insights.timeframe,
        ),
        localityPriceTrend: buildTrend(
          insights.localityTrend,
          insights.timeframe,
        ),
      },
    });
  } catch (error) {
    return res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};


// ─── GET /api/properties/popular?city=...&limit=30 ──────────────────────────
exports.getPopularProperties = async (req, res) => {
  try {
    const { city, area, limit = 30, listingType, propertyCategory } = req.query;

    const filter = { deletedAt: null, status: "Active" };
    if (city) filter.city = { $regex: city, $options: "i" };
    // Area-wise filter for popular properties
    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$or = [{ city_area: areaRegex }, { locality: areaRegex }];
    }
    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select(
          "_id title propertyName bhk bedrooms price possession propertyType propertyCategory city locality coverImage media createdAt",
        )
        .sort({ createdAt: -1 })
        .limit(Number(limit)),
      Property.countDocuments(filter),
    ]);

    const data = properties.map((p) => {
      const firstImage = (p.media || []).find((m) => m.type === "image");
      return {
        propertyId: p._id,
        title: p.title || p.propertyName,
        location: [p.locality, p.city].filter(Boolean).join(", "),
        price: p.price,
        config: [
          p.bhk || p.bedrooms ? `${p.bhk || p.bedrooms} BHK` : null,
          p.propertyType,
        ]
          .filter(Boolean)
          .join(" "),
        possessionYear: p.possession || null,
        coverImage: firstImage
          ? getPropertyMediaUrl(firstImage.fileName, "image")
          : p.coverImage || null,
      };
    });

    return res.status(status.OK).json({
      success: true,
      message: "Popular properties fetched successfully",
      data: {
        totalCount: total,
        city: city || null,
        properties: data,
      },
    });
  } catch (error) {
    return res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};


// ─── GET /api/properties/count?city=...&listingType=... ─────────────────────
exports.getPropertyCount = async (req, res) => {
  try {
    const {
      city,
      area,
      listingType,
      propertyCategory,
      status: propStatus,
    } = req.query;

    const filter = { deletedAt: null };
    if (city) filter.city = { $regex: city, $options: "i" };
    // Area-wise filter for property count
    if (area) {
      const areaRegex = { $regex: area.trim(), $options: "i" };
      filter.$or = [{ city_area: areaRegex }, { locality: areaRegex }];
    }
    if (listingType) filter.listingType = listingType;
    if (propertyCategory) filter.propertyCategory = propertyCategory;
    if (propStatus) filter.status = propStatus;
    else filter.status = "Active";

    const count = await Property.countDocuments(filter);

    return res.status(status.OK).json({
      success: true,
      message: "Property count fetched successfully",
      data: { count, city: city || null },
    });
  } catch (error) {
    return res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

// ─── POST /api/properties/:id/brochure (Upload brochure PDF, owner/dealer unique) ───
exports.uploadPropertyBrochure = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "No brochure file uploaded",
      });
    }

    // Validate file size (max 5 MB)
    const maxBrochureSize = 5 * 1024 * 1024;
    if (req.file.size > maxBrochureSize) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Brochure PDF must be 5 MB or less",
      });
    }

    const property = await Property.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!property) {
      return res.status(status.NotFound).json({
        success: false,
        message: "Property not found",
      });
    }

    // Authorization Check: Must be the owner, dealer, or admin
    const isOwner = property.ownerId && property.ownerId.toString() === req.user.id;
    const isDealer = property.dealerId && property.dealerId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isDealer && !isAdmin) {
      return res.status(status.Forbidden).json({
        success: false,
        message: "Forbidden: You are not authorized to upload a brochure to this property",
      });
    }

    // Enforce max count limit (e.g. max 3 brochures per property as documented)
    const existingBrochures = property.brochure || [];
    if (existingBrochures.length >= 3) {
      return res.status(status.BadRequest).json({
        success: false,
        message: "Limit reached: A property can have at most 3 brochures",
      });
    }

    // Upload to ImageKit
    const uploaded = await uploadToImagekit(req.file, "properties/brochures");

    // Add to property
    const newBrochureEntry = {
      fileName: uploaded.fileName,
      uploadedAt: new Date(),
    };

    property.brochure = [...existingBrochures, newBrochureEntry];
    await property.save();

    // Map URL for response
    const responseBrochure = {
      ...newBrochureEntry,
      url: getPropertyBrochureUrl(newBrochureEntry.fileName),
    };

    return res.status(status.OK).json({
      success: true,
      message: "Brochure uploaded successfully",
      data: responseBrochure,
    });
  } catch (error) {
    console.log("UPLOAD PROPERTY BROCHURE ERROR:", error);
    return res.status(status.InternalServerError).json({
      success: false,
      message: error.message,
    });
  }
};


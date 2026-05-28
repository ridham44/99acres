const mongoose = require('mongoose');

const User        = require('../models/user.model');
const Property    = require('../models/property.model');
const Requirement = require('../models/requirement.model');
const Inquiry     = require('../models/inquiry.model');
const status      = require('../utils/statusCodes');
const { getUserProfileImageUrl, getUserDocumentUrl, getPropertyMediaUrl } = require('../utils/imagekitUrl');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    return {
        ...obj,
        profileImageUrl: getUserProfileImageUrl(obj.profileImage),
        documentUrls:   (obj.documents || []).map((f) => getUserDocumentUrl(f)),
    };
};

const formatProperty = (prop) => {
    const obj = prop.toObject ? prop.toObject() : { ...prop };
    obj.media = (obj.media || []).map((m) => ({
        ...m,
        url: getPropertyMediaUrl(m.fileName, m.type),
    }));
    const firstImage = obj.media.find((m) => m.type === 'image');
    obj.coverImage = firstImage?.url || obj.coverImage || null;
    return obj;
};

// ─── Pagination helper ────────────────────────────────────────────────────────
const paginate = (page, limit) => {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return { skip: (p - 1) * l, limit: l, page: p };
};

// =============================================================================
// 1.  GET /api/admin/users
//     All users (role: user | broker | channel_partner | builder)
//     Query: page, limit, search (name / phone / email), role
// =============================================================================
exports.getAllUsers = async (req, res) => {
    try {
        const { page, limit, search, role, isVerified } = req.query;

        const filter = {
            deletedAt: null,
            role: { $in: ['user', 'broker', 'channel_partner', 'builder'] },
        };

        // optional role filter (must not be admin)
        if (role && ['user', 'broker', 'channel_partner', 'builder'].includes(role)) {
            filter.role = role;
        }

        // optional isVerified filter
        if (isVerified === 'true' || isVerified === 'false') {
            filter.isVerified = isVerified === 'true';
        }

        // optional search across name / phone / email / agencyName
        if (search) {
            filter.$or = [
                { name:       { $regex: search, $options: 'i' } },
                { phone:      { $regex: search, $options: 'i' } },
                { email:      { $regex: search, $options: 'i' } },
                { agencyName: { $regex: search, $options: 'i' } },
            ];
        }

        const { skip, limit: lim, page: pg } = paginate(page, limit);
        const total = await User.countDocuments(filter);

        const users = await User.find(filter)
            .select('-__v')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim);

        return res.status(status.OK).json({
            success:    true,
            message:    'Users fetched successfully',
            total,
            page:       pg,
            limit:      lim,
            totalPages: Math.ceil(total / lim),
            data:       users.map(formatUser),
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

// =============================================================================
// 2.  GET /api/admin/users/:id
//     Full user detail + their property list + activity counts
// =============================================================================
exports.getUserDetail = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({ success: false, message: 'Invalid user id' });
        }

        const user = await User.findOne({ _id: id, deletedAt: null }).select('-__v');

        if (!user) {
            return res.status(status.NotFound).json({ success: false, message: 'User not found' });
        }

        // fetch all non-deleted properties owned / dealt by this user
        const properties = await Property.find({
            $or: [{ ownerId: id }, { dealerId: id }],
            deletedAt: null,
        })
            .select('title propertyName propertyCategory propertyType listingType city locality price priceUnit status coverImage media createdAt')
            .sort({ createdAt: -1 });

        const formattedProperties = properties.map(formatProperty);

        // property counts by status
        const statusCounts = formattedProperties.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
        }, {});

        return res.status(status.OK).json({
            success: true,
            message: 'User detail fetched successfully',
            data: {
                user: formatUser(user),
                propertySummary: {
                    total: formattedProperties.length,
                    byStatus: statusCounts,
                },
                properties: formattedProperties,
            },
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

// =============================================================================
// 3.  GET /api/admin/properties
//     All properties across all users
//     Query: page, limit, search (title/city/locality), status, listingType, propertyCategory
// =============================================================================
exports.getAllProperties = async (req, res) => {
    try {
        const { page, limit, search, status: propStatus, listingType, propertyCategory, propertyType, bedrooms, bathrooms, priceRange, areaRange } = req.query;

        const filter = { deletedAt: null };

        if (propStatus)        filter.status          = propStatus;
        if (listingType)       filter.listingType      = listingType;
        if (propertyCategory)  filter.propertyCategory = propertyCategory;
        if (propertyType)      filter.propertyType     = propertyType;

        if (bedrooms && bedrooms !== 'all') {
            if (bedrooms === '4+') {
                filter.bedrooms = { $gte: 4 };
            } else {
                filter.bedrooms = Number(bedrooms);
            }
        }

        if (bathrooms && bathrooms !== 'all') {
            if (bathrooms === '3+') {
                filter.bathrooms = { $gte: 3 };
            } else {
                filter.bathrooms = Number(bathrooms);
            }
        }

        if (priceRange && priceRange !== 'all') {
            if (priceRange === 'under50L') {
                filter.price = { $lt: 5000000 };
            } else if (priceRange === '50L-1Cr') {
                filter.price = { $gte: 5000000, $lte: 10000000 };
            } else if (priceRange === '1Cr-3Cr') {
                filter.price = { $gte: 10000000, $lte: 30000000 };
            } else if (priceRange === 'above3Cr') {
                filter.price = { $gt: 30000000 };
            }
        }

        if (areaRange && areaRange !== 'all') {
            if (areaRange === 'under1000') {
                filter.area = { $lt: 1000 };
            } else if (areaRange === '1000-2000') {
                filter.area = { $gte: 1000, $lte: 2000 };
            } else if (areaRange === '2000-3000') {
                filter.area = { $gte: 2000, $lte: 3000 };
            } else if (areaRange === 'above3000') {
                filter.area = { $gt: 3000 };
            }
        }

        if (search) {
            filter.$or = [
                { title:    { $regex: search, $options: 'i' } },
                { city:     { $regex: search, $options: 'i' } },
                { locality: { $regex: search, $options: 'i' } },
            ];
        }

        const { skip, limit: lim, page: pg } = paginate(page, limit);
        const total = await Property.countDocuments(filter);

        const properties = await Property.find(filter)
            .select('title propertyName propertyCategory propertyType listingType city city_area locality state price priceUnit status coverImage media bedrooms bathrooms area measureType ownerId dealerId createdAt')
            .populate('ownerId',  'name phone email role')
            .populate('dealerId', 'name phone email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim);

        return res.status(status.OK).json({
            success:    true,
            message:    'Properties fetched successfully',
            total,
            page:       pg,
            limit:      lim,
            totalPages: Math.ceil(total / lim),
            data:       properties.map(formatProperty),
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

// =============================================================================
// 4.  GET /api/admin/requirements
//     All requirements with basic user info and matched-property summary
//     Query: page, limit, search (location), status, transactionType
// =============================================================================
exports.getRequirements = async (req, res) => {
    try {
        const { page, limit, search, status: reqStatus, transactionType, bhk, propertyType, budgetRange } = req.query;

        const filter = { deletedAt: null };

        if (reqStatus)        filter.status          = reqStatus;
        if (transactionType)  filter.transactionType = transactionType;

        if (bhk && bhk !== 'all') {
            filter.bhks = { $regex: bhk, $options: 'i' };
        }

        if (propertyType && propertyType !== 'all') {
            filter.propertyTypes = { $regex: propertyType, $options: 'i' };
        }

        if (budgetRange && budgetRange !== 'all') {
            if (budgetRange === 'under50L') {
                filter.minBudget = { $lt: 5000000 };
            } else if (budgetRange === '50L-1.5Cr') {
                filter.$or = [
                    { minBudget: { $lte: 15000000 }, maxBudget: { $gte: 5000000 } }
                ];
            } else if (budgetRange === '1.5Cr-5Cr') {
                filter.$or = [
                    { minBudget: { $lte: 50000000 }, maxBudget: { $gte: 15000000 } }
                ];
            } else if (budgetRange === 'above5Cr') {
                filter.maxBudget = { $gte: 50000000 };
            }
        }

        if (search) {
            filter.locations = { $elemMatch: { $regex: search, $options: 'i' } };
        }

        const { skip, limit: lim, page: pg } = paginate(page, limit);
        const total = await Requirement.countDocuments(filter);

        const requirements = await Requirement.find(filter)
            .populate('userId', 'name phone email role city state')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim);

        // For each requirement, count how many active properties loosely match
        // (same transaction type direction: Buy→Sale, Rent→Rent, Commercial→either)
        const data = await Promise.all(
            requirements.map(async (req) => {
                const obj = req.toObject ? req.toObject() : { ...req };

                const listingMatch = obj.transactionType === 'Buy'
                    ? 'Sale'
                    : obj.transactionType === 'Rent'
                        ? 'Rent'
                        : undefined; // Commercial matches both

                const propFilter = { deletedAt: null, status: 'Active' };
                if (listingMatch) propFilter.listingType = listingMatch;

                const matchedPropertyCount = await Property.countDocuments(propFilter);

                return {
                    _id:                obj._id,
                    userId:             obj.userId,        // populated
                    transactionType:    obj.transactionType,
                    locations:          obj.locations,
                    propertyTypes:      obj.propertyTypes,
                    minBudget:          obj.minBudget,
                    maxBudget:          obj.maxBudget,
                    minArea:            obj.minArea,
                    maxArea:            obj.maxArea,
                    bhks:               obj.bhks,
                    status:             obj.status,
                    createdAt:          obj.createdAt,
                    matchedPropertyCount,
                };
            }),
        );

        return res.status(status.OK).json({
            success:    true,
            message:    'Requirements fetched successfully',
            total,
            page:       pg,
            limit:      lim,
            totalPages: Math.ceil(total / lim),
            data,
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

// =============================================================================
// 5.  GET /api/admin/requirements/:id
//     Full requirement detail
// =============================================================================
exports.getRequirementById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({ success: false, message: 'Invalid requirement id' });
        }

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null })
            .populate('userId',     'name phone email role city state profileImage')
            .populate('amenityIds', 'amenityName');

        if (!requirement) {
            return res.status(status.NotFound).json({ success: false, message: 'Requirement not found' });
        }

        // build a simple property match filter from requirement data
        const obj = requirement.toObject();
        const listingMatch = obj.transactionType === 'Buy'
            ? 'Sale'
            : obj.transactionType === 'Rent'
                ? 'Rent'
                : undefined;

        const propFilter = { deletedAt: null, status: 'Active' };
        if (listingMatch) propFilter.listingType = listingMatch;
        if (obj.locations?.length) {
            propFilter.$or = obj.locations.map((loc) => ({
                $or: [
                    { city:     { $regex: loc, $options: 'i' } },
                    { locality: { $regex: loc, $options: 'i' } },
                    { city_area:{ $regex: loc, $options: 'i' } },
                ],
            }));
        }

        // Fetch up to 5 loosely-matched properties as preview
        const matchedProperties = await Property.find(propFilter)
            .select('title propertyName propertyCategory propertyType listingType city locality price priceUnit bedrooms area measureType coverImage media status')
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(status.OK).json({
            success: true,
            message: 'Requirement fetched successfully',
            data: {
                requirement: obj,
                matchedProperties: matchedProperties.map(formatProperty),
            },
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

// =============================================================================
// 6.  GET /api/admin/inquiries
//     All inquiries across the platform with user + basic property details
//     Query: page, limit, search (username/phone), status (true/false), isAgent
// =============================================================================
exports.getInquiries = async (req, res) => {
    try {
        const { page, limit, search, status: inquiryStatus, isAgent, propertyCategory, listingType, priceRange, assigned } = req.query;

        const filter = { deletedAt: null };

        if (inquiryStatus && inquiryStatus !== 'all') {
            filter.status = inquiryStatus === 'true';
        }

        if (isAgent && ['Yes', 'No'].includes(isAgent)) {
            filter.isAgent = isAgent;
        }

        if (assigned && assigned !== 'all') {
            if (assigned === 'assigned') {
                filter.userId = { $ne: null };
            } else if (assigned === 'unassigned') {
                filter.$or = [
                    { userId: null },
                    { userId: { $exists: false } }
                ];
            }
        }

        let propFilterActive = false;
        const propQuery = { deletedAt: null };
        if (propertyCategory && propertyCategory !== 'all') {
            propQuery.propertyCategory = propertyCategory;
            propFilterActive = true;
        }
        if (listingType && listingType !== 'all') {
            propQuery.listingType = listingType;
            propFilterActive = true;
        }
        if (priceRange && priceRange !== 'all') {
            propFilterActive = true;
            if (priceRange === 'under50L') {
                propQuery.price = { $lt: 5000000 };
            } else if (priceRange === '50L-1.5Cr') {
                propQuery.price = { $gte: 5000000, $lte: 15000000 };
            } else if (priceRange === '1.5Cr-5Cr') {
                propQuery.price = { $gte: 15000000, $lte: 50000000 };
            } else if (priceRange === 'above5Cr') {
                propQuery.price = { $gt: 50000000 };
            }
        }

        if (propFilterActive) {
            const matchedProperties = await Property.find(propQuery).select('_id');
            const matchedIds = matchedProperties.map(p => p._id);
            filter.property_id = { $in: matchedIds };
        }

        if (search) {
            filter.$or = [
                { username:    { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
            ];
        }

        const { skip, limit: lim, page: pg } = paginate(page, limit);
        const total = await Inquiry.countDocuments(filter);

        const inquiries = await Inquiry.find(filter)
            .populate('userId', 'name phone email role')
            .populate({
                path:  'property_id',
                match: { deletedAt: null },
                select: 'title propertyName propertyCategory listingType city locality price priceUnit coverImage media status ownerId dealerId',
                populate: [
                    { path: 'ownerId',  select: 'name phone email role' },
                    { path: 'dealerId', select: 'name phone email role' },
                ],
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim);

        const data = inquiries.map((inq) => {
            const doc = inq.toObject();
            if (doc.property_id) {
                doc.property_id = formatProperty({ toObject: () => doc.property_id });
            }
            return doc;
        });

        return res.status(status.OK).json({
            success:    true,
            message:    'Inquiries fetched successfully',
            total,
            page:       pg,
            limit:      lim,
            totalPages: Math.ceil(total / lim),
            data,
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({ success: false, message: err.message });
    }
};

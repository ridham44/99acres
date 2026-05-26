const mongoose = require('mongoose');
const Inquiry = require('../models/inquiry.model');
const Property = require('../models/property.model');
const status = require('../utils/statusCodes');
const { getPropertyMediaUrl } = require('../utils/imagekitUrl');

// ─── Shared helper ────────────────────────────────────────────────────────────

/**
 * Converts a raw property Mongoose object and maps its media to full CDN URLs.
 */
const formatPropertyWithMedia = (prop) => {
    const obj = prop.toObject ? prop.toObject() : { ...prop };

    obj.media = (obj.media || []).map((m) => ({
        ...m,
        url: getPropertyMediaUrl(m.fileName, m.type),
    }));

    const firstImage = obj.media.find((m) => m.type === 'image');
    obj.coverImage = firstImage?.url || obj.coverImage || null;

    return obj;
};

// ─── API 1: Submit Inquiry ────────────────────────────────────────────────────
// POST /api/inquiries
// Auth required (logged-in user)
// Body: { username, phoneNumber, property_id }
//
// Returns: created inquiry + property owner/dealer contact info + full property detail

exports.submitInquiry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, phoneNumber, property_id, isAgent } = req.body;

        // ── Validation ──────────────────────────────────────────────────────
        if (!username || !username.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'username is required',
            });
        }

        if (!phoneNumber || !phoneNumber.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'phoneNumber is required',
            });
        }

        if (isAgent && !['Yes', 'No'].includes(isAgent)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'isAgent must be "Yes" or "No"',
            });
        }

        if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'phoneNumber must be 10 digits starting with 6-9',
            });
        }

        if (!property_id || !mongoose.Types.ObjectId.isValid(property_id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Valid property_id is required',
            });
        }

        // ── Check property exists ───────────────────────────────────────────
        const property = await Property.findOne({
            _id: property_id,
            deletedAt: null,
        })
            .populate('ownerId', 'name email phone role')
            .populate('dealerId', 'name email phone role')
            .populate('amenityIds', 'amenityName')
            .populate('furnishings.furnishingId', 'furnitureName')
            .populate('nearbyPlaces.nearbyId', 'placeName placeType city locality');

        if (!property) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property not found',
            });
        }

        // ── Prevent duplicate open inquiry on the same property ─────────────
        const existing = await Inquiry.findOne({
            userId,
            property_id,
            status: true,
            deletedAt: null,
        });

        if (existing) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'You have already submitted an inquiry for this property',
            });
        }

        // ── Create inquiry ──────────────────────────────────────────────────
        const inquiry = await Inquiry.create({
            userId,
            property_id,
            username: username.trim(),
            phoneNumber: phoneNumber.trim(),
            isAgent: isAgent || 'No',
            status: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // ── Build full property response with media URLs ─────────────────────
        const propertyObj = formatPropertyWithMedia(property);

        // ── Resolve who to contact (dealer takes priority over owner) ────────
        const contactPerson = propertyObj.dealerId || propertyObj.ownerId || null;

        return res.status(status.CREATED).json({
            success: true,
            message: 'Inquiry submitted successfully',
            data: {
                inquiry: {
                    _id: inquiry._id,
                    username: inquiry.username,
                    phoneNumber: inquiry.phoneNumber,
                    isAgent: inquiry.isAgent,
                    status: inquiry.status,
                    property_id: inquiry.property_id,
                    createdAt: inquiry.createdAt,
                },
                contactPerson,
                property: propertyObj,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── API 2: Owner / Dealer — View all inquiries on their properties ───────────
// GET /api/inquiries/received
// Auth required (owner or dealer)
// Query: page, limit
//
// Returns: list of inquiries with user details + full property detail

exports.getReceivedInquiries = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit } = req.query;

        // Find all properties that belong to this user (as owner or dealer)
        const myPropertyIds = await Property.find({
            $or: [{ ownerId: userId }, { dealerId: userId }],
            deletedAt: null,
        }).distinct('_id');

        if (myPropertyIds.length === 0) {
            return res.status(status.OK).json({
                success: true,
                message: 'No inquiries received yet',
                data: [],
                pagination: null,
            });
        }

        const filter = {
            property_id: { $in: myPropertyIds },
            deletedAt: null,
        };

        let query = Inquiry.find(filter)
            .populate('userId', 'name email phone role')
            .populate({
                path: 'property_id',
                match: { deletedAt: null },
                populate: [
                    { path: 'ownerId', select: 'name email phone role' },
                    { path: 'dealerId', select: 'name email phone role' },
                    { path: 'amenityIds', select: 'amenityName' },
                    { path: 'furnishings.furnishingId', select: 'furnitureName' },
                    { path: 'nearbyPlaces.nearbyId', select: 'placeName placeType city locality' },
                ],
            })
            .sort({ createdAt: -1 });

        let pagination = null;
        const totalInquiries = await Inquiry.countDocuments(filter);

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total: totalInquiries,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalInquiries / limitNumber),
            };
        }

        const inquiries = await query;

        const data = inquiries
            .filter((inq) => inq.property_id !== null)
            .map((inq) => {
                const doc = inq.toObject();
                if (doc.property_id) {
                    doc.property_id = formatPropertyWithMedia({ toObject: () => doc.property_id });
                }
                return {
                    _id: doc._id,
                    username: doc.username,
                    phoneNumber: doc.phoneNumber,
                    status: doc.status,
                    createdAt: doc.createdAt,
                    // who submitted the inquiry
                    userDetail: doc.userId,
                    // full property
                    property: doc.property_id,
                };
            });

        return res.status(status.OK).json({
            success: true,
            message: 'Received inquiries fetched successfully',
            totalInquiries,
            data,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── API 3: User Contact — Properties I submitted inquiries for ───────────────
// GET /api/inquiries/my
// Auth required (any user)
// Query: page, limit
//
// Returns: list of full property details for properties the user inquired about

exports.getMyInquiries = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page, limit } = req.query;

        const filter = {
            userId,
            deletedAt: null,
        };

        let query = Inquiry.find(filter)
            .populate({
                path: 'property_id',
                match: { deletedAt: null },
                populate: [
                    { path: 'ownerId', select: 'name email phone role' },
                    { path: 'dealerId', select: 'name email phone role' },
                    { path: 'amenityIds', select: 'amenityName' },
                    { path: 'furnishings.furnishingId', select: 'furnitureName' },
                    { path: 'nearbyPlaces.nearbyId', select: 'placeName placeType city locality' },
                ],
            })
            .sort({ createdAt: -1 });

        let pagination = null;
        const totalInquiries = await Inquiry.countDocuments(filter);

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skip = (pageNumber - 1) * limitNumber;

            query = query.skip(skip).limit(limitNumber);

            pagination = {
                total: totalInquiries,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalInquiries / limitNumber),
            };
        }

        const inquiries = await query;

        const data = inquiries
            .filter((inq) => inq.property_id !== null)
            .map((inq) => {
                const doc = inq.toObject();
                const property = doc.property_id
                    ? formatPropertyWithMedia({ toObject: () => doc.property_id })
                    : null;

                return {
                    _id: doc._id,
                    username: doc.username,
                    phoneNumber: doc.phoneNumber,
                    status: doc.status,
                    createdAt: doc.createdAt,
                    property,
                };
            });

        return res.status(status.OK).json({
            success: true,
            message: 'Your inquiries fetched successfully',
            totalInquiries,
            data,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── API 4: Check Inquiry Status ─────────────────────────────────────────────
// GET /api/inquiries/status/:propertyId
// Auth required
// Returns: { isInquired: true/false }

exports.checkInquiryStatus = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        const inquiry = await Inquiry.findOne({
            userId,
            property_id: propertyId,
            status: true,
            deletedAt: null,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Inquiry status fetched successfully',
            data: {
                propertyId,
                isInquired: !!inquiry,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

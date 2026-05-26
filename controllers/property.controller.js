const Property = require('../models/property.model');
const User = require('../models/user.model');
const Amenity = require('../models/amenity.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getPropertyMediaUrl } = require('../utils/imagekitUrl');
const { recordPropertyVisit } = require('./userHome.controller');

const formatPropertyCard = (item) => {
    const firstImage = (item.media || []).find((mediaItem) => mediaItem.type === 'image');
    const coverImage = firstImage
        ? getPropertyMediaUrl(firstImage.fileName, firstImage.type)
        : item.coverImage || null;

    return {
        _id: item._id,
        title: item.title || item.propertyName,
        propertyName: item.propertyName,
        propertyType: item.propertyType,
        propertyCategory: item.propertyCategory,
        listingType: item.listingType,
        price: item.price,
        priceUnit: item.priceUnit,
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
        coverImage,
        postedBy: item.dealerId || item.ownerId || null,
        createdAt: item.createdAt,
    };
};

exports.createProperty = async (req, res) => {
    try {
        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        const media = [];

        for (const file of imageFiles) {
            const uploaded = await uploadToImagekit(file, 'properties/images');

            media.push({
                type: 'image',
                fileName: uploaded.fileName,
            });
        }

        for (const file of videoFiles) {
            const uploaded = await uploadToImagekit(file, 'properties/videos');

            media.push({
                type: 'video',
                fileName: uploaded.fileName,
            });
        }

        let ownerId;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (userRole === 'user' || userRole === 'builder') {
            ownerId = userId;
        } else if (userRole === 'broker' || userRole === 'channel_partner') {
            ownerId = req.body.ownerId || userId;
        } else {
            ownerId = userId;
        }

        // --- Parse Technical Audit Fields (if they come as JSON strings from form-data) ---
        const jsonFields = [
            'nearbyLandmarks', 'locationCoordinates', 'keyHighlights', 'floorPlans',
            'legalCertificates', 'propWorthInsights', 'reviewTopics', 'preLeasedDetails',
            'approvedIndustryTypes', 'keySpecifications', 'projectDetails', 'aboutProject',
            'aboutLocality', 'aboutDeveloper', 'topAgents', 'amenityIds', 'furnishings', 'nearbyPlaces'
        ];

        jsonFields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch (e) {
                    console.log(`Error parsing ${field}:`, e.message);
                }
            }
        });

        const property = await Property.create({
            ...req.body,
            ownerId,
            media,
            createdAt: new Date(),
        });

        const propertyObj = property.toObject();

        propertyObj.media = (propertyObj.media || []).map((item) => ({
            ...item,
            url: getPropertyMediaUrl(item.fileName, item.type),
        }));

        return res.status(status.CREATED).json({
            success: true,
            message: 'Property created successfully',
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
                { title: { $regex: search, $options: 'i' } },
                { propertyName: { $regex: search, $options: 'i' } },
                { propertyType: { $regex: search, $options: 'i' } },
                { locality: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
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
                : String(locations).split(',').map(l => l.trim()).filter(Boolean);
            
            if (locationArray.length > 0) {
                const locationQueries = locationArray.map(loc => ({
                    $or: [
                        { city: { $regex: loc, $options: 'i' } },
                        { locality: { $regex: loc, $options: 'i' } },
                        { city_area: { $regex: loc, $options: 'i' } },
                        { address: { $regex: loc, $options: 'i' } },
                    ]
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
            if (city) filter.city = { $regex: city, $options: 'i' };
            if (locality) filter.locality = { $regex: locality, $options: 'i' };
            if (city_area) filter.city_area = { $regex: city_area, $options: 'i' };
            if (state) filter.state = { $regex: state, $options: 'i' };
        }

        // 4. Listing Type & Category
        if (listingType) filter.listingType = listingType;
        if (propertyCategory) filter.propertyCategory = propertyCategory;

        // 5. Property Type (Single or List)
        if (propertyTypes || propertyType) {
            const types = propertyTypes 
                ? (Array.isArray(propertyTypes) ? propertyTypes : String(propertyTypes).split(','))
                : [propertyType];
            const cleanTypes = types.map(t => t.trim()).filter(Boolean);
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
            const furnishingArray = Array.isArray(furnishing) ? furnishing : String(furnishing).split(',');
            const mapping = {
                'Furnished': 'Yes',
                'Semi-Furnished': 'Semi',
                'Unfurnished': 'No'
            };
            const mappedValues = furnishingArray.map(f => mapping[f.trim()]).filter(Boolean);
            if (mappedValues.length > 0) {
                filter.furnished = { $in: mappedValues };
            }
        }

        // 10. Amenities (Look up by name)
        if (amenities) {
            const amenityNames = Array.isArray(amenities) ? amenities : String(amenities).split(',').map(a => a.trim()).filter(Boolean);
            if (amenityNames.length > 0) {
                const foundAmenities = await Amenity.find({ amenityName: { $in: amenityNames.map(n => new RegExp(`^${n}$`, 'i')) } }).select('_id');
                if (foundAmenities.length > 0) {
                    filter.amenityIds = { $in: foundAmenities.map(a => a._id) };
                }
            }
        }

        // 11. Facing
        if (facing) {
            const facingArray = Array.isArray(facing) ? facing : String(facing).split(',').map(f => f.trim()).filter(Boolean);
            if (facingArray.length > 0) {
                filter.facing = { $in: facingArray.map(f => new RegExp(`^${f}$`, 'i')) };
            }
        }

        // 12. Floor Levels
        if (minFloor || maxFloor) {
            filter.floor = {};
            const parseFloor = (f) => {
                if (f === 'Ground') return 0;
                if (f === 'Basement') return -1;
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
            const types = Array.isArray(saleType) ? saleType : String(saleType).split(',').map(s => s.trim().toLowerCase());
            // Map "new" to properties with age 0 or "New"
            if (types.includes('new') && !types.includes('resale')) {
                filter.propertyAge = { $in: ['0', 'New', 'New Construction', '0-1 Years'] };
            } else if (types.includes('resale') && !types.includes('new')) {
                filter.propertyAge = { $nin: ['0', 'New', 'New Construction', '0-1 Years'] };
            }
        }

        // 14. Posted By (Agent / Owner / Builder)
        if (postedBy) {
            const posters = Array.isArray(postedBy) ? postedBy : String(postedBy).split(',').map(p => p.trim());
            const roles = [];
            if (posters.includes('Owner')) roles.push('user');
            if (posters.includes('Agent')) roles.push('broker', 'channel_partner');
            if (posters.includes('Builder')) roles.push('builder');

            if (roles.length > 0) {
                const users = await User.find({ role: { $in: roles } }).select('_id');
                const userIds = users.map(u => u._id);
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
            if (sortBy === 'price_asc' || sortBy === 'Price (L-H)') sort = { price: 1 };
            else if (sortBy === 'price_desc' || sortBy === 'Price (H-L)') sort = { price: -1 };
            else if (sortBy === 'oldest') sort = { createdAt: 1 };
            else if (sortBy === 'newest' || sortBy === 'Most Recent') sort = { createdAt: -1 };
        }

        const currentPage = Number(page) || 1;
        const currentLimit = Number(limit) || 10;
        const skip = (currentPage - 1) * currentLimit;

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .select(
                    '_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing amenityIds furnishingIds nearbyIds ownership flooring waterSource otherKeyFacilities',
                )
                .populate('ownerId', 'name role')
                .populate('dealerId', 'name role')
                .sort(sort)
                .skip(skip)
                .limit(currentLimit),
            Property.countDocuments(filter),
        ]);

        const data = properties.map(formatPropertyCard);

        return res.status(status.OK).json({
            success: true,
            message: 'Properties fetched successfully',
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

exports.myProperty = async (req, res) => {
    try {
        const {
            search,
            status: propertyStatus,
            listingType,
            propertyCategory,
            propertyType,
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
                        { title: { $regex: search, $options: 'i' } },
                        { propertyName: { $regex: search, $options: 'i' } },
                        { propertyType: { $regex: search, $options: 'i' } },
                        { locality: { $regex: search, $options: 'i' } },
                        { city_area: { $regex: search, $options: 'i' } },
                        { city: { $regex: search, $options: 'i' } },
                        { state: { $regex: search, $options: 'i' } },
                        { address: { $regex: search, $options: 'i' } },
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

        let sort = { createdAt: -1 };

        if (sortBy === 'price_asc') {
            sort = { price: 1 };
        } else if (sortBy === 'price_desc') {
            sort = { price: -1 };
        } else if (sortBy === 'oldest') {
            sort = { createdAt: 1 };
        } else if (sortBy === 'newest') {
            sort = { createdAt: -1 };
        }

        const currentPage = Number(page) || 1;
        const currentLimit = Number(limit) || 10;
        const skip = (currentPage - 1) * currentLimit;

        const [properties, total] = await Promise.all([
            Property.find(filter)
                .select(
                    '_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing createdAt',
                )
                .populate('ownerId', 'name role')
                .populate('dealerId', 'name role')
                .sort(sort)
                .skip(skip)
                .limit(currentLimit),
            Property.countDocuments(filter),
        ]);

        return res.status(status.OK).json({
            success: true,
            message: 'My properties fetched successfully',
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

exports.getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const property = await Property.findOne({
            _id: id,
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

        try {
            await recordPropertyVisit(req.user.id, id);
        } catch (visitError) {
            console.log('PROPERTY VISIT TRACKING ERROR:', visitError.message);
        }

        const propertyObj = property.toObject();

        // add `postedBy` field similar to list response (dealerId || ownerId)
        propertyObj.postedBy = propertyObj.dealerId || propertyObj.ownerId || null;

        // ✅ map media using helper
        propertyObj.media = (propertyObj.media || []).map((item) => ({
            ...item,    
            url: getPropertyMediaUrl(item.fileName, item.type),
        }));

        const firstImage = propertyObj.media.find((item) => item.type === 'image');
        propertyObj.coverImage = firstImage?.url || propertyObj.coverImage || null;

        propertyObj.furnishings = (propertyObj.furnishings || []).map((item) => ({
            furnishingId: {
                ...(item.furnishingId || {}),
                quantity: item.quantity,
            },
        }));

        propertyObj.nearbyPlaces = (propertyObj.nearbyPlaces || []).map((item) => ({
            nearbyId: {
                ...(item.nearbyId || {}),
                distance: item.distance,
                distanceUnit: item.distanceUnit,
            },
        }));

        return res.status(status.OK).json({
            success: true,
            message: 'Property fetched successfully',
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
                message: 'Property not found',
            });
        }

        // --- Parse Technical Audit Fields (if they come as JSON strings from form-data) ---
        const jsonFields = [
            'nearbyLandmarks', 'locationCoordinates', 'keyHighlights', 'floorPlans',
            'legalCertificates', 'propWorthInsights', 'reviewTopics', 'preLeasedDetails',
            'approvedIndustryTypes', 'keySpecifications', 'projectDetails', 'aboutProject',
            'aboutLocality', 'aboutDeveloper', 'topAgents', 'amenityIds', 'furnishings', 'nearbyPlaces'
        ];

        jsonFields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch (e) {
                    console.log(`Error parsing ${field}:`, e.message);
                }
            }
        });

        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        let media = existingProperty.media || [];

        if (videoFiles.length > 0) {
            media = media.filter((item) => item.type !== 'video');
        }

        for (const file of imageFiles) {
            const uploaded = await uploadToImagekit(file, 'properties/images');

            media.push({
                fileName: uploaded.fileName,
                type: 'image',
                uploadedAt: new Date(),
            });
        }

        for (const file of videoFiles) {
            const uploaded = await uploadToImagekit(file, 'properties/videos');

            media.push({
                fileName: uploaded.fileName,
                type: 'video',
                uploadedAt: new Date(),
            });
        }

        const property = await Property.findOneAndUpdate(
            { _id: id, deletedAt: null },
            {
                ...req.body,
                media,
                updatedAt: new Date(),
            },
            { new: true },
        )
            .populate('ownerId', 'name email phone role')
            .populate('dealerId', 'name email phone role')
            .populate('amenityIds', 'amenityName')
            .populate('furnishings.furnishingId', 'furnitureName')
            .populate('nearbyPlaces.nearbyId', 'placeName placeType city locality');

        const propertyObj = property.toObject();

        // map media URLs (same as getPropertyById)
        propertyObj.media = (propertyObj.media || []).map((item) => ({
            ...item,
            url: getPropertyMediaUrl(item.fileName, item.type),
        }));

        const firstImage = propertyObj.media.find((item) => item.type === 'image');
        propertyObj.coverImage = firstImage?.url || propertyObj.coverImage || null;

        propertyObj.furnishings = (propertyObj.furnishings || []).map((item) => ({
            furnishingId: {
                ...(item.furnishingId || {}),
                quantity: item.quantity,
            },
        }));

        propertyObj.nearbyPlaces = (propertyObj.nearbyPlaces || []).map((item) => ({
            nearbyId: {
                ...(item.nearbyId || {}), 
                distance: item.distance,
                distanceUnit: item.distanceUnit,
            },
        }));

        return res.status(status.OK).json({
            success: true,
            message: 'Property updated successfully',
            data: propertyObj,
        });
    } catch (error) {
        console.log('UPDATE PROPERTY ERROR:', error);

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
                message: 'Property not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Property deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

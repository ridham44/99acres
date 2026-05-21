const Property = require('../models/property.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getPropertyMediaUrl } = require('../utils/imagekitUrl');

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
        } else if (userRole === 'broker' || userRole === 'dealer') {
            ownerId = req.body.ownerId || userId;
        } else {
            ownerId = userId;
        }

        const property = await Property.create({
            ...req.body,
            ownerId,
            media,
            createdAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Property created successfully',
            data: property,
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
            city,
            state,
            locality,
            listingType,
            propertyCategory,
            propertyType,
            bhk,
            bedrooms,
            bathrooms,
            minPrice,
            maxPrice,
            minArea,
            maxArea,
            facing,
            furnishingIds,
            amenityIds,
            nearbyIds,
            ownerId,
            dealerId,
            sortBy,
            page,
            limit,
        } = req.query;

        const filter = { deletedAt: null };

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

        if (propertyStatus) {
            filter.status = propertyStatus;
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (state) {
            filter.state = { $regex: state, $options: 'i' };
        }

        if (locality) {
            filter.locality = { $regex: locality, $options: 'i' };
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

        if (bhk) {
            filter.bhk = Number(bhk);
        }

        if (bedrooms) {
            filter.bedrooms = Number(bedrooms);
        }

        if (bathrooms) {
            filter.bathrooms = Number(bathrooms);
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        if (minArea || maxArea) {
            filter.area = {};
            if (minArea) {
                filter.area.$gte = Number(minArea);
            }
            if (maxArea) {
                filter.area.$lte = Number(maxArea);
            }
        }

        if (facing) {
            filter.facing = facing;
        }

        if (ownerId) {
            filter.ownerId = ownerId;
        }

        if (dealerId) {
            filter.dealerId = dealerId;
        }

        if (furnishingIds) {
            const furnishingArray = Array.isArray(furnishingIds)
                ? furnishingIds
                : String(furnishingIds)
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean);

            if (furnishingArray.length > 0) {
                filter['furnishingIds.id'] = { $in: furnishingArray };
            }
        }

        if (amenityIds) {
            const amenityArray = Array.isArray(amenityIds)
                ? amenityIds
                : String(amenityIds)
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean);

            if (amenityArray.length > 0) {
                filter.amenityIds = { $in: amenityArray };
            }
        }

        if (nearbyIds) {
            const nearbyArray = Array.isArray(nearbyIds)
                ? nearbyIds
                : String(nearbyIds)
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean);

            if (nearbyArray.length > 0) {
                filter['nearbyIds.id'] = { $in: nearbyArray };
            }
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
                    '_id title propertyName propertyType propertyCategory listingType price priceUnit address locality city state status ownerId dealerId media bhk bedrooms bathrooms area facing amenityIds furnishingIds nearbyIds',
                )
                .populate('ownerId', 'name role')
                .populate('dealerId', 'name role')
                .sort(sort)
                .skip(skip)
                .limit(currentLimit),
            Property.countDocuments(filter),
        ]);

        const data = properties.map((item) => {
            const firstImage = (item.media || []).find((mediaItem) => mediaItem.type === 'image');

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
                city: item.city,
                state: item.state,
                status: item.status,
                coverImage: firstImage ? getPropertyMediaUrl(firstImage.fileName, firstImage.type) : null,
                postedBy: item.dealerId || item.ownerId || null,
            };
        });

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

exports.getPropertyById = async (req, res) => {
    try {
        const { id } = req.params;

        const property = await Property.findOne({
            _id: id,
            deletedAt: null,
        })
            .populate('ownerId', 'name email phone role')
            .populate('dealerId', 'name email phone role')
            .populate('amenityIds', 'name')
            .populate('furnishings.furnishingId', 'name')
            .populate('nearbyPlaces.nearbyId', 'name');

        if (!property) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property not found',
            });
        }

        const propertyObj = property.toObject();

        // ✅ map media using helper
        propertyObj.media = (propertyObj.media || []).map((item) => ({
            ...item,
            url: getPropertyMediaUrl(item.fileName, item.type),
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

        if (req.body.amenityIds) {
            req.body.amenityIds = JSON.parse(req.body.amenityIds);
        }

        if (req.body.furnishings) {
            req.body.furnishings = JSON.parse(req.body.furnishings);
        }

        if (req.body.nearbyPlaces) {
            req.body.nearbyPlaces = JSON.parse(req.body.nearbyPlaces);
        }

        const imageFiles = req.files?.images || [];
        const videoFiles = req.files?.videos || [];

        let media = existingProperty.media || [];

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
            .populate('amenityIds', 'name')
            .populate('furnishings.furnishingId', 'name')
            .populate('nearbyPlaces.nearbyId', 'name');

        return res.status(status.OK).json({
            success: true,
            message: 'Property updated successfully',
            data: property,
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

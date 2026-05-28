const mongoose = require('mongoose');
const Property = require('../models/property.model');
const PropertyVisit = require('../models/propertyVisit.model');
const status = require('../utils/statusCodes');
const { getPropertyMediaUrl } = require('../utils/imagekitUrl');

const propertyCardFields =
    '_id title propertyName propertyType propertyCategory listingType price priceUnit priceOnRequest address locality city city_area state status ownerId dealerId media coverImage bhk bedrooms bathrooms area facing createdAt';

const formatPropertyCard = (property, extra = {}) => {
    if (!property) {
        return null;
    }

    const item = typeof property.toObject === 'function' ? property.toObject() : property;
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
        ...extra,
    };
};

const getRecentlyVisitedProperties = async (userId, limit = 10) => {
    const visits = await PropertyVisit.find({ userId })
        .sort({ lastVisitedAt: -1 })
        .limit(limit)
        .populate({
            path: 'propertyId',
            match: { deletedAt: null },
            select: propertyCardFields,
            populate: [
                { path: 'ownerId', select: 'name role' },
                { path: 'dealerId', select: 'name role' },
            ],
        });

    return visits
        .filter((visit) => visit.propertyId)
        .map((visit) =>
            formatPropertyCard(visit.propertyId, {
                visitCount: visit.visitCount,
                lastVisitedAt: visit.lastVisitedAt,
            }),
        );
};

const getVisitedProperties = async (userId, page = 1, limit = 10) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [result] = await PropertyVisit.aggregate([
        {
            $match: {
                userId: userObjectId,
            },
        },
        {
            $lookup: {
                from: 'properties',
                localField: 'propertyId',
                foreignField: '_id',
                as: 'property',
            },
        },
        { $unwind: '$property' },
        {
            $match: {
                'property.deletedAt': null,
            },
        },
        {
            $sort: {
                lastVisitedAt: -1,
            },
        },
        {
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                total: [{ $count: 'count' }],
            },
        },
    ]);

    const total = result?.total?.[0]?.count || 0;
    const properties = (result?.data || []).map((visit) =>
        formatPropertyCard(visit.property, {
            visitCount: visit.visitCount,
            lastVisitedAt: visit.lastVisitedAt,
        }),
    );

    return {
        properties,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getNewLaunchProperties = async (limit = 5) => {
    const properties = await Property.find({ deletedAt: null })
        .select(propertyCardFields)
        .populate('ownerId', 'name role')
        .populate('dealerId', 'name role')
        .sort({ createdAt: -1 })
        .limit(limit);

    return properties.map((property) => formatPropertyCard(property));
};

const getSponsoredProperties = async (limit = 3) => {
    const properties = await Property.find({ deletedAt: null })
        .select(propertyCardFields)
        .populate('ownerId', 'name role')
        .populate('dealerId', 'name role')
        .sort({ createdAt: -1 })
        .limit(limit);

    return properties.map((property) =>
        formatPropertyCard(property, {
            isSponsored: true,
        }),
    );
};

const getTopAreas = async (areaLimit = 3, propertyLimit = 3) => {
    const topAreas = await PropertyVisit.aggregate([
        {
            $group: {
                _id: '$propertyId',
                visitCount: { $sum: '$visitCount' },
                lastVisitedAt: { $max: '$lastVisitedAt' },
            },
        },
        {
            $lookup: {
                from: 'properties',
                localField: '_id',
                foreignField: '_id',
                as: 'property',
            },
        },
        { $unwind: '$property' },
        {
            $match: {
                'property.deletedAt': null,
            },
        },
        {
            $sort: {
                visitCount: -1,
                lastVisitedAt: -1,
            },
        },
        {
            $group: {
                _id: {
                    city: '$property.city',
                    city_area: '$property.city_area',
                    locality: '$property.locality',
                },
                totalVisits: { $sum: '$visitCount' },
                propertyCount: { $sum: 1 },
                properties: {
                    $push: {
                        property: '$property',
                        visitCount: '$visitCount',
                        lastVisitedAt: '$lastVisitedAt',
                    },
                },
            },
        },
        {
            $sort: {
                totalVisits: -1,
                propertyCount: -1,
            },
        },
        { $limit: areaLimit },
    ]);

    return topAreas.map((area) => ({
        city: area._id.city,
        city_area: area._id.city_area,
        locality: area._id.locality,
        areaName: area._id.city_area || area._id.locality || area._id.city,
        totalVisits: area.totalVisits,
        propertyCount: area.propertyCount,
        topProperties: area.properties.slice(0, propertyLimit).map((item) =>
            formatPropertyCard(item.property, {
                visitCount: item.visitCount,
                lastVisitedAt: item.lastVisitedAt,
            }),
        ),
    }));
};

const recordPropertyVisit = async (userId, propertyId) => {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(propertyId)) {
        return null;
    }

    const now = new Date();

    return PropertyVisit.findOneAndUpdate(
        {
            userId,
            propertyId,
        },
        {
            $set: {
                lastVisitedAt: now,
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
            },
            $inc: {
                visitCount: 1,
            },
        },
        {
            upsert: true,
            new: true,
        },
    );
};

exports.recordPropertyVisit = recordPropertyVisit;
exports.getRecentlyVisitedProperties = getRecentlyVisitedProperties;
exports.getVisitedProperties = getVisitedProperties;
exports.getNewLaunchProperties = getNewLaunchProperties;
exports.getSponsoredProperties = getSponsoredProperties;
exports.getTopAreas = getTopAreas;

exports.getUserHome = async (req, res) => {
    try {
        const userId = req.user.id;
        const visitedLimit = req.query.visitedLimit || 10;
        const newLaunchLimit = req.query.newLaunchLimit || 5;
        const sponsoredLimit = req.query.sponsoredLimit || 3;
        const topAreaLimit = req.query.topAreaLimit || 3;
        const topPropertyLimit = req.query.topPropertyLimit || 3;

        const [recentlyVisited, newLaunchProperties, sponsoredProperties, topAreas] = await Promise.all([
            getRecentlyVisitedProperties(userId, visitedLimit),
            getNewLaunchProperties(newLaunchLimit),
            getSponsoredProperties(sponsoredLimit),
            getTopAreas(topAreaLimit, topPropertyLimit),
        ]);

        return res.status(status.OK).json({
            success: true,
            message: 'User home fetched successfully',
            data: {
                recentlyVisited,
                newLaunchProperties,
                sponsoredProperties,
                topAreas,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getMyVisitedProperties = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;

        const { properties, pagination } = await getVisitedProperties(userId, page, limit);

        return res.status(status.OK).json({
            success: true,
            message: 'Visited properties fetched successfully',
            data: properties,
            pagination,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

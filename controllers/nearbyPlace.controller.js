const mongoose = require('mongoose');
const NearbyPlace = require('../models/nearbyPlace.model');
const status = require('../utils/statusCodes');

exports.createNearbyPlace = async (req, res) => {
    try {
        const { city, locality, placeName, placeType } = req.body;

        if (!city || !city.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'city is required',
            });
        }

        if (!locality || !locality.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'locality is required',
            });
        }

        if (!placeName || !placeName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'placeName is required',
            });
        }

        if (!placeType || !placeType.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'placeType is required',
            });
        }

        const existingNearbyPlace = await NearbyPlace.findOne({
            city: city.trim(),
            locality: locality.trim(),
            placeName: placeName.trim(),
            placeType: placeType.trim(),
            deletedAt: null,
        });

        if (existingNearbyPlace) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Nearby place already exists',
            });
        }

        const nearbyPlace = await NearbyPlace.create({
            city: city.trim(),
            locality: locality.trim(),
            placeName: placeName.trim(),
            placeType: placeType.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Nearby place created successfully',
            data: nearbyPlace,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getNearbyPlaces = async (req, res) => {
    try {
        const { search, city, locality, placeType, page, limit } = req.query;

        const filter = { deletedAt: null };

        if (search) {
            filter.$or = [
                { city: { $regex: search, $options: 'i' } },
                { locality: { $regex: search, $options: 'i' } },
                { placeName: { $regex: search, $options: 'i' } },
                { placeType: { $regex: search, $options: 'i' } },
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (locality) {
            filter.locality = { $regex: locality, $options: 'i' };
        }

        if (placeType) {
            filter.placeType = { $regex: placeType, $options: 'i' };
        }

        const total = await NearbyPlace.countDocuments(filter);

        let query = NearbyPlace.find(filter).sort({ createdAt: -1 });

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

        const nearbyPlaces = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Nearby places fetched successfully',
            data: nearbyPlaces,
            pagination,
            meta: {
                totalNearbyPlaces: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getNearbyPlaceById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid nearby place id',
            });
        }

        const nearbyPlace = await NearbyPlace.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!nearbyPlace) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Nearby place not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Nearby place fetched successfully',
            data: nearbyPlace,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateNearbyPlace = async (req, res) => {
    try {
        const { id } = req.params;
        const { city, locality, placeName, placeType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid nearby place id',
            });
        }

        if (!city || !city.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'city is required',
            });
        }

        if (!locality || !locality.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'locality is required',
            });
        }

        if (!placeName || !placeName.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'placeName is required',
            });
        }

        if (!placeType || !placeType.trim()) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'placeType is required',
            });
        }

        const nearbyPlace = await NearbyPlace.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!nearbyPlace) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Nearby place not found',
            });
        }

        const existingNearbyPlace = await NearbyPlace.findOne({
            _id: { $ne: id },
            city: city.trim(),
            locality: locality.trim(),
            placeName: placeName.trim(),
            placeType: placeType.trim(),
            deletedAt: null,
        });

        if (existingNearbyPlace) {
            return res.status(status.Conflict).json({
                success: false,
                message: 'Nearby place already exists',
            });
        }

        nearbyPlace.city = city.trim();
        nearbyPlace.locality = locality.trim();
        nearbyPlace.placeName = placeName.trim();
        nearbyPlace.placeType = placeType.trim();
        nearbyPlace.updatedAt = new Date();

        await nearbyPlace.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Nearby place updated successfully',
            data: nearbyPlace,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteNearbyPlace = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid nearby place id',
            });
        }

        const nearbyPlace = await NearbyPlace.findOneAndUpdate(
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

        if (!nearbyPlace) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Nearby place not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Nearby place deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

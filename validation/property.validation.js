const mongoose = require('mongoose');
const status = require('../utils/statusCodes');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const propertyCategories = ['Residential', 'Commercial', 'PG'];
const listingTypes = ['Sale', 'Rent'];
const priceUnits = ['total', 'monthly'];
const measureTypes = ['sqft', 'sqmt', 'yard', 'bigha'];
const furnishedTypes = ['No', 'Semi', 'Yes'];
const availableForTypes = ['Family', 'Bachelors', 'Anyone', 'Boys', 'Girls'];
const propertyStatuses = ['Draft', 'Active', 'Inactive', 'Sold', 'Rented'];
const distanceUnits = ['m', 'km'];

const sendError = (res, message) => {
    return res.status(status.BadRequest).json({
        success: false,
        message,
    });
};

const validateRequiredString = (value) => typeof value === 'string' && value.trim() !== '';

const validateNonNegativeNumber = (value) => typeof value === 'number' && !Number.isNaN(value) && value >= 0;

const toNumber = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
};

const toBoolean = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true') return true;
        if (lower === 'false') return false;
    }
    return value;
};

const toJsonArray = (value) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed;
        } catch (error) {
            return value;
        }
    }

    return value;
};

const normalizeBody = (req) => {
    req.body.price = toNumber(req.body.price);
    req.body.area = toNumber(req.body.area);
    req.body.carpetArea = toNumber(req.body.carpetArea);
    req.body.bedrooms = toNumber(req.body.bedrooms);
    req.body.bathrooms = toNumber(req.body.bathrooms);
    req.body.balcony = toNumber(req.body.balcony);
    req.body.floor = toNumber(req.body.floor);
    req.body.totalFloors = toNumber(req.body.totalFloors);
    req.body.agreementMonths = toNumber(req.body.agreementMonths);
    req.body.deposit = toNumber(req.body.deposit);
    req.body.maintenance = toNumber(req.body.maintenance);

    req.body.parking = toBoolean(req.body.parking);
    req.body.lift = toBoolean(req.body.lift);

    req.body.amenityIds = toJsonArray(req.body.amenityIds);
    req.body.furnishings = toJsonArray(req.body.furnishings);
    req.body.nearbyPlaces = toJsonArray(req.body.nearbyPlaces);

    if (Array.isArray(req.body.furnishings)) {
        req.body.furnishings = req.body.furnishings.map((item) => ({
            ...item,
            quantity: toNumber(item.quantity),
        }));
    }

    if (Array.isArray(req.body.nearbyPlaces)) {
        req.body.nearbyPlaces = req.body.nearbyPlaces.map((item) => ({
            ...item,
            distance: toNumber(item.distance),
        }));
    }
};

const validateCreateProperty = (req, res, next) => {
    try {
        normalizeBody(req);

        const {
            dealerId,
            title,
            propertyName,
            propertyCategory,
            propertyType,
            listingType,
            city,
            state,
            locality,
            address,
            price,
            priceUnit,
            area,
            measureType,
            carpetArea,
            bedrooms,
            bathrooms,
            balcony,
            furnished,
            parking,
            lift,
            floor,
            totalFloors,
            availableFor,
            agreementMonths,
            deposit,
            maintenance,
            amenityIds,
            furnishings,
            nearbyPlaces,
            status: propertyStatus,
        } = req.body;

        if (dealerId && !isValidObjectId(dealerId)) {
            return sendError(res, 'Invalid dealerId');
        }

        if (!validateRequiredString(title)) {
            return sendError(res, 'Title is required');
        }

        if (!validateRequiredString(propertyName)) {
            return sendError(res, 'Property name is required');
        }

        if (!propertyCategory || !propertyCategories.includes(propertyCategory)) {
            return sendError(res, 'Invalid propertyCategory');
        }

        if (!validateRequiredString(propertyType)) {
            return sendError(res, 'Property type is required');
        }

        if (!listingType || !listingTypes.includes(listingType)) {
            return sendError(res, 'Invalid listingType');
        }

        if (!validateRequiredString(city)) {
            return sendError(res, 'City is required');
        }

        if (!validateRequiredString(state)) {
            return sendError(res, 'State is required');
        }

        if (!validateRequiredString(locality)) {
            return sendError(res, 'Locality is required');
        }

        if (!validateRequiredString(address)) {
            return sendError(res, 'Address is required');
        }

        if (!validateNonNegativeNumber(price)) {
            return sendError(res, 'Valid price is required');
        }

        if (priceUnit && !priceUnits.includes(priceUnit)) {
            return sendError(res, 'Invalid priceUnit');
        }

        if (!validateNonNegativeNumber(area)) {
            return sendError(res, 'Valid area is required');
        }

        if (measureType && !measureTypes.includes(measureType)) {
            return sendError(res, 'Invalid measureType');
        }

        if (carpetArea !== undefined && !validateNonNegativeNumber(carpetArea)) {
            return sendError(res, 'Invalid carpetArea');
        }

        if (bedrooms !== undefined && !validateNonNegativeNumber(bedrooms)) {
            return sendError(res, 'Invalid bedrooms');
        }

        if (bathrooms !== undefined && !validateNonNegativeNumber(bathrooms)) {
            return sendError(res, 'Invalid bathrooms');
        }

        if (balcony !== undefined && !validateNonNegativeNumber(balcony)) {
            return sendError(res, 'Invalid balcony');
        }

        if (furnished && !furnishedTypes.includes(furnished)) {
            return sendError(res, 'Invalid furnished value');
        }

        if (parking !== undefined && typeof parking !== 'boolean') {
            return sendError(res, 'Parking must be boolean');
        }

        if (lift !== undefined && typeof lift !== 'boolean') {
            return sendError(res, 'Lift must be boolean');
        }

        if (floor !== undefined && !validateNonNegativeNumber(floor)) {
            return sendError(res, 'Invalid floor');
        }

        if (totalFloors !== undefined && !validateNonNegativeNumber(totalFloors)) {
            return sendError(res, 'Invalid totalFloors');
        }

        if (availableFor && !availableForTypes.includes(availableFor)) {
            return sendError(res, 'Invalid availableFor');
        }

        if (agreementMonths !== undefined && !validateNonNegativeNumber(agreementMonths)) {
            return sendError(res, 'Invalid agreementMonths');
        }

        if (deposit !== undefined && !validateNonNegativeNumber(deposit)) {
            return sendError(res, 'Invalid deposit');
        }

        if (maintenance !== undefined && !validateNonNegativeNumber(maintenance)) {
            return sendError(res, 'Invalid maintenance');
        }

        if (propertyStatus && !propertyStatuses.includes(propertyStatus)) {
            return sendError(res, 'Invalid status');
        }

        if (amenityIds !== undefined) {
            if (!Array.isArray(amenityIds)) {
                return sendError(res, 'amenityIds must be an array');
            }

            for (const amenityId of amenityIds) {
                if (!isValidObjectId(amenityId)) {
                    return sendError(res, 'Invalid amenityId in amenityIds');
                }
            }
        }

        if (furnishings !== undefined) {
            if (!Array.isArray(furnishings)) {
                return sendError(res, 'furnishings must be an array');
            }

            for (const item of furnishings) {
                if (!item.furnishingId || !isValidObjectId(item.furnishingId)) {
                    return sendError(res, 'Invalid furnishingId in furnishings');
                }

                if (!validateNonNegativeNumber(item.quantity) || item.quantity < 1) {
                    return sendError(res, 'Quantity must be at least 1 in furnishings');
                }
            }
        }

        if (nearbyPlaces !== undefined) {
            if (!Array.isArray(nearbyPlaces)) {
                return sendError(res, 'nearbyPlaces must be an array');
            }

            for (const item of nearbyPlaces) {
                if (!item.nearbyId || !isValidObjectId(item.nearbyId)) {
                    return sendError(res, 'Invalid nearbyId in nearbyPlaces');
                }

                if (!validateNonNegativeNumber(item.distance)) {
                    return sendError(res, 'Distance must be a non-negative number in nearbyPlaces');
                }

                if (item.distanceUnit && !distanceUnits.includes(item.distanceUnit)) {
                    return sendError(res, 'Invalid distanceUnit in nearbyPlaces');
                }
            }
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const validateUpdateProperty = (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(res, 'Invalid property id');
        }

        normalizeBody(req);

        const {
            ownerId,
            dealerId,
            title,
            propertyName,
            propertyCategory,
            propertyType,
            listingType,
            city,
            state,
            locality,
            address,
            price,
            priceUnit,
            area,
            measureType,
            carpetArea,
            bedrooms,
            bathrooms,
            balcony,
            furnished,
            parking,
            lift,
            floor,
            totalFloors,
            availableFor,
            agreementMonths,
            deposit,
            maintenance,
            amenityIds,
            furnishings,
            nearbyPlaces,
            status: propertyStatus,
        } = req.body;

        if (ownerId !== undefined && !isValidObjectId(ownerId)) {
            return sendError(res, 'Invalid ownerId');
        }

        if (dealerId !== undefined && dealerId !== null && dealerId !== '' && !isValidObjectId(dealerId)) {
            return sendError(res, 'Invalid dealerId');
        }

        if (title !== undefined && !validateRequiredString(title)) {
            return sendError(res, 'Title cannot be empty');
        }

        if (propertyName !== undefined && !validateRequiredString(propertyName)) {
            return sendError(res, 'Property name cannot be empty');
        }

        if (propertyCategory !== undefined && !propertyCategories.includes(propertyCategory)) {
            return sendError(res, 'Invalid propertyCategory');
        }

        if (propertyType !== undefined && !validateRequiredString(propertyType)) {
            return sendError(res, 'Property type cannot be empty');
        }

        if (listingType !== undefined && !listingTypes.includes(listingType)) {
            return sendError(res, 'Invalid listingType');
        }

        if (city !== undefined && !validateRequiredString(city)) {
            return sendError(res, 'City cannot be empty');
        }

        if (state !== undefined && !validateRequiredString(state)) {
            return sendError(res, 'State cannot be empty');
        }

        if (locality !== undefined && !validateRequiredString(locality)) {
            return sendError(res, 'Locality cannot be empty');
        }

        if (address !== undefined && !validateRequiredString(address)) {
            return sendError(res, 'Address cannot be empty');
        }

        if (price !== undefined && !validateNonNegativeNumber(price)) {
            return sendError(res, 'Invalid price');
        }

        if (priceUnit !== undefined && !priceUnits.includes(priceUnit)) {
            return sendError(res, 'Invalid priceUnit');
        }

        if (area !== undefined && !validateNonNegativeNumber(area)) {
            return sendError(res, 'Invalid area');
        }

        if (measureType !== undefined && !measureTypes.includes(measureType)) {
            return sendError(res, 'Invalid measureType');
        }

        if (carpetArea !== undefined && !validateNonNegativeNumber(carpetArea)) {
            return sendError(res, 'Invalid carpetArea');
        }

        if (bedrooms !== undefined && !validateNonNegativeNumber(bedrooms)) {
            return sendError(res, 'Invalid bedrooms');
        }

        if (bathrooms !== undefined && !validateNonNegativeNumber(bathrooms)) {
            return sendError(res, 'Invalid bathrooms');
        }

        if (balcony !== undefined && !validateNonNegativeNumber(balcony)) {
            return sendError(res, 'Invalid balcony');
        }

        if (furnished !== undefined && !furnishedTypes.includes(furnished)) {
            return sendError(res, 'Invalid furnished value');
        }

        if (parking !== undefined && typeof parking !== 'boolean') {
            return sendError(res, 'Parking must be boolean');
        }

        if (lift !== undefined && typeof lift !== 'boolean') {
            return sendError(res, 'Lift must be boolean');
        }

        if (floor !== undefined && !validateNonNegativeNumber(floor)) {
            return sendError(res, 'Invalid floor');
        }

        if (totalFloors !== undefined && !validateNonNegativeNumber(totalFloors)) {
            return sendError(res, 'Invalid totalFloors');
        }

        if (availableFor !== undefined && !availableForTypes.includes(availableFor)) {
            return sendError(res, 'Invalid availableFor');
        }

        if (agreementMonths !== undefined && !validateNonNegativeNumber(agreementMonths)) {
            return sendError(res, 'Invalid agreementMonths');
        }

        if (deposit !== undefined && !validateNonNegativeNumber(deposit)) {
            return sendError(res, 'Invalid deposit');
        }

        if (maintenance !== undefined && !validateNonNegativeNumber(maintenance)) {
            return sendError(res, 'Invalid maintenance');
        }

        if (propertyStatus !== undefined && !propertyStatuses.includes(propertyStatus)) {
            return sendError(res, 'Invalid status');
        }

        if (amenityIds !== undefined) {
            if (!Array.isArray(amenityIds)) {
                return sendError(res, 'amenityIds must be an array');
            }

            for (const amenityId of amenityIds) {
                if (!isValidObjectId(amenityId)) {
                    return sendError(res, 'Invalid amenityId in amenityIds');
                }
            }
        }

        if (furnishings !== undefined) {
            if (!Array.isArray(furnishings)) {
                return sendError(res, 'furnishings must be an array');
            }

            for (const item of furnishings) {
                if (!item.furnishingId || !isValidObjectId(item.furnishingId)) {
                    return sendError(res, 'Invalid furnishingId in furnishings');
                }

                if (!validateNonNegativeNumber(item.quantity) || item.quantity < 1) {
                    return sendError(res, 'Quantity must be at least 1 in furnishings');
                }
            }
        }

        if (nearbyPlaces !== undefined) {
            if (!Array.isArray(nearbyPlaces)) {
                return sendError(res, 'nearbyPlaces must be an array');
            }

            for (const item of nearbyPlaces) {
                if (!item.nearbyId || !isValidObjectId(item.nearbyId)) {
                    return sendError(res, 'Invalid nearbyId in nearbyPlaces');
                }

                if (!validateNonNegativeNumber(item.distance)) {
                    return sendError(res, 'Distance must be a non-negative number in nearbyPlaces');
                }

                if (item.distanceUnit !== undefined && !distanceUnits.includes(item.distanceUnit)) {
                    return sendError(res, 'Invalid distanceUnit in nearbyPlaces');
                }
            }
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const validatePropertyId = (req, res, next) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return sendError(res, 'Invalid property id');
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    validateCreateProperty,
    validateUpdateProperty,
    validatePropertyId,
};

const Requirement = require('../models/requirement.model');
const Property = require('../models/property.model');
const status = require('../utils/statusCodes');
const mongoose = require('mongoose');

// Create Requirement
exports.createRequirement = async (req, res) => {
    try {
        const userId = req.user.id;
        const requirement = await Requirement.create({
            ...req.body,
            userId,
            createdAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Requirement shared successfully',
            data: requirement,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Get My Requirements
exports.getMyRequirements = async (req, res) => {
    try {
        const userId = req.user.id;
        const requirements = await Requirement.find({ userId, deletedAt: null }).sort({ createdAt: -1 });

        return res.status(status.OK).json({
            success: true,
            data: requirements,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Get All Requirements (For Agents/Lead Discovery)
exports.getAllRequirements = async (req, res) => {
    try {
        const { transactionType, city, minBudget, maxBudget, page = 1, limit = 10 } = req.query;

        const filter = { deletedAt: null, status: 'Active' };

        if (transactionType) filter.transactionType = transactionType;
        if (city) filter.locations = { $in: [new RegExp(city, 'i')] };
        if (minBudget || maxBudget) {
            filter.minBudget = { $lte: Number(maxBudget || Infinity) };
            filter.maxBudget = { $gte: Number(minBudget || 0) };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const [requirements, total] = await Promise.all([
            Requirement.find(filter).populate('userId', 'name phone email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            Requirement.countDocuments(filter),
        ]);

        return res.status(status.OK).json({
            success: true,
            data: requirements,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Match Engine: Get Properties matching a specific Requirement
exports.getMatchedPropertiesForRequirement = async (req, res) => {
    try {
        const { requirementId } = req.params;
        const requirement = await Requirement.findById(requirementId);

        if (!requirement) {
            return res.status(status.NotFound).json({ success: false, message: 'Requirement not found' });
        }

        // Build Match Query
        const query = {
            deletedAt: null,
            status: 'Active',
            listingType: requirement.transactionType === 'Buy' ? 'Sale' : 'Rent',
        };

        // 1. Locations
        if (requirement.locations && requirement.locations.length > 0) {
            query.$or = [
                { city: { $in: requirement.locations.map(l => new RegExp(l, 'i')) } },
                { locality: { $in: requirement.locations.map(l => new RegExp(l, 'i')) } },
                { city_area: { $in: requirement.locations.map(l => new RegExp(l, 'i')) } }
            ];
        }

        // 2. Property Types
        if (requirement.propertyTypes && requirement.propertyTypes.length > 0) {
            query.propertyType = { $in: requirement.propertyTypes };
        }

        // 3. Price/Budget Range
        if (requirement.maxBudget > 0) {
            query.price = { $gte: requirement.minBudget, $lte: requirement.maxBudget };
        }

        // 4. BHK
        if (requirement.bhks && requirement.bhks.length > 0) {
            const bhkNumbers = requirement.bhks.map(b => parseInt(b)).filter(n => !isNaN(n));
            if (bhkNumbers.length > 0) {
                query.bedrooms = { $in: bhkNumbers };
            }
        }

        // 5. Area
        if (requirement.maxArea > 0) {
            query.area = { $gte: requirement.minArea, $lte: requirement.maxArea };
        }

        const properties = await Property.find(query).limit(20);

        // Add Match Percentage
        const results = properties.map(property => {
            let matches = 1; // It already matches basic query (transaction type)
            let totalCriteria = 1;

            if (requirement.locations && requirement.locations.length > 0) {
                totalCriteria++;
                const locMatch = requirement.locations.some(l => 
                    (property.city && property.city.toLowerCase().includes(l.toLowerCase())) ||
                    (property.locality && property.locality.toLowerCase().includes(l.toLowerCase()))
                );
                if (locMatch) matches++;
            }

            if (requirement.propertyTypes && requirement.propertyTypes.length > 0) {
                totalCriteria++;
                if (requirement.propertyTypes.includes(property.propertyType)) matches++;
            }

            if (requirement.bhks && requirement.bhks.length > 0) {
                totalCriteria++;
                const bhkNumbers = requirement.bhks.map(b => parseInt(b));
                if (bhkNumbers.includes(property.bedrooms)) matches++;
            }

            if (requirement.maxBudget > 0) {
                totalCriteria++;
                if (property.price >= requirement.minBudget && property.price <= requirement.maxBudget) matches++;
            }

            return {
                ...property.toObject(),
                matchPercentage: Math.round((matches / totalCriteria) * 100)
            };
        });

        return res.status(status.OK).json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete Requirement (Soft Delete)
exports.deleteRequirement = async (req, res) => {
    try {
        const { id } = req.params;
        await Requirement.findByIdAndUpdate(id, { deletedAt: new Date() });

        return res.status(status.OK).json({
            success: true,
            message: 'Requirement deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

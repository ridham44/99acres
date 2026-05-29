const Requirement = require('../models/requirement.model');
const Property = require('../models/property.model');
const status = require('../utils/statusCodes');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { sendToUsers } = require('../utils/socket');

// Create Requirement
exports.createRequirement = async (req, res) => {
    try {
        const userId = req.user.id;
        const requirement = await Requirement.create({
            ...req.body,
            userId,
            createdAt: new Date(),
        });

        // Broadcast to all brokers, builders, channel partners, and admins (except current user)
        const targetUsers = await User.find({
            role: { $in: ['broker', 'builder', 'admin', 'channel_partner'] },
            _id: { $ne: new mongoose.Types.ObjectId(userId) },
            deletedAt: null,
        }).select('_id');

        if (targetUsers.length > 0) {
            const userName = req.user.name || 'A user';
            
            // Format dynamic location and area string
            const areaStr = requirement.area ? ` (${requirement.area.trim()})` : '';
            const locationStr = (Array.isArray(requirement.locations) && requirement.locations.length > 0
                ? requirement.locations.join(', ')
                : 'N/A') + areaStr;

            const notificationDataArray = targetUsers.map((user) => ({
                senderId: userId,
                recipientId: user._id,
                recipientType: 'user',
                title: 'New Property Requirement Submitted',
                message: `${userName} submitted a new property requirement for: ${locationStr}.`,
                type: 'general',
                relatedId: requirement._id,
                relatedModel: 'Requirement',
            }));

            // Batch insert for performance
            await Notification.insertMany(notificationDataArray);

            // Push real-time event to all targeted users
            const targetUserIds = targetUsers.map((u) => u._id.toString());
            sendToUsers(targetUserIds, 'notification', {
                title: 'New Property Requirement Submitted',
                message: `${userName} submitted a new property requirement for: ${locationStr}.`,
                type: 'general',
                relatedId: requirement._id,
                relatedModel: 'Requirement',
                createdAt: new Date(),
            });
        }

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
        const { status: reqStatus = 'All' } = req.query; // Default to All to show both active/inactive
        
        const filter = { userId, deletedAt: null };
        if (reqStatus !== 'All') {
            filter.status = reqStatus;
        }

        const requirements = await Requirement.find(filter).sort({ createdAt: -1 });

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

// Get Requirement Detail
exports.getRequirementById = async (req, res) => {
    try {
        const { id } = req.params;
        const requirement = await Requirement.findOne({ _id: id, deletedAt: null }).populate('userId', 'name phone email');

        if (!requirement) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Requirement not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            data: requirement,
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
        const { transactionType, city, area, minBudget, maxBudget, status: reqStatus = 'Active', page = 1, limit = 10 } = req.query;

        const filter = { deletedAt: null };
        if (reqStatus !== 'All') {
            filter.status = reqStatus;
        }

        if (transactionType) filter.transactionType = transactionType;
        if (city) filter.locations = { $in: [new RegExp(city.trim(), 'i')] };
        if (area) filter.area = { $regex: area.trim(), $options: 'i' };
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

        // 1b. Locality/City Area (Specific Requirement Area)
        if (requirement.area && requirement.area.trim()) {
            const areaRegex = new RegExp(requirement.area.trim(), 'i');
            if (query.$or) {
                // If locations already exists, we match the area inside city_area or locality as well
                query.$or.push({ locality: areaRegex });
                query.$or.push({ city_area: areaRegex });
            } else {
                query.$or = [
                    { locality: areaRegex },
                    { city_area: areaRegex }
                ];
            }
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

            if (requirement.area && requirement.area.trim()) {
                totalCriteria++;
                const areaLower = requirement.area.trim().toLowerCase();
                const areaMatch = (property.locality && property.locality.toLowerCase().includes(areaLower)) ||
                                  (property.city_area && property.city_area.toLowerCase().includes(areaLower));
                if (areaMatch) matches++;
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

// Update Requirement (Owner only)
exports.updateRequirement = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Fields that must NOT be changed by the client
        const { userId: _u, createdAt: _c, deletedAt: _d, ...updateData } = req.body;

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null });

        if (!requirement) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Requirement not found',
            });
        }

        // Only the owner can update
        if (requirement.userId.toString() !== userId.toString()) {
            return res.status(status.Forbidden).json({
                success: false,
                message: 'You are not authorized to update this requirement',
            });
        }

        const updated = await Requirement.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true },
        );

        return res.status(status.OK).json({
            success: true,
            message: 'Requirement updated successfully',
            data: updated,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Toggle Requirement Status (Active/Inactive)
exports.toggleRequirementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const requirement = await Requirement.findOne({ _id: id, deletedAt: null });

        if (!requirement) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Requirement not found',
            });
        }

        // Only the owner can toggle status
        if (requirement.userId.toString() !== userId.toString()) {
            return res.status(status.Forbidden).json({
                success: false,
                message: 'You are not authorized to modify this requirement',
            });
        }

        const { status: bodyStatus } = req.body;
        const newStatus = bodyStatus || (requirement.status === 'Active' ? 'Inactive' : 'Active');
        requirement.status = newStatus;
        await requirement.save();

        return res.status(status.OK).json({
            success: true,
            message: `Requirement marked as ${newStatus}`,
            data: requirement,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

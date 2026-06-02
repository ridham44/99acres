const Sponsor = require('../models/sponsor.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getSponsorLogoUrl } = require('../utils/imagekitUrl');

const mapSponsor = (sponsor) => {
    if (!sponsor) return null;
    const sponsorObj = typeof sponsor.toObject === 'function' ? sponsor.toObject() : sponsor;

    return {
        ...sponsorObj,
        logoUrl: sponsorObj.logo ? getSponsorLogoUrl(sponsorObj.logo) : null,
    };
};

const buildFilter = (query, isAdmin = false) => {
    const filter = {};

    if (isAdmin && query.status) {
        filter.status = query.status;
    }

    if (!isAdmin) {
        filter.status = 'active';
        filter.$and = [
            { $or: [{ startDate: null }, { startDate: { $lte: new Date() } }] },
            { $or: [{ endDate: null }, { endDate: { $gte: new Date() } }] },
        ];
    }

    if (query.location) {
        filter.location = { $regex: query.location, $options: 'i' };
    }

    if (query.displayOrder !== undefined) {
        filter.displayOrder = query.displayOrder;
    }

    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { location: { $regex: query.search, $options: 'i' } },
            { websiteUrl: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

exports.createSponsor = async (req, res) => {
    try {
        let logo = null;
        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'sponsors/logos');
            logo = uploaded.fileName;
        }

        const sponsor = await Sponsor.create({
            name: req.body.name,
            logo,
            location: req.body.location,
            websiteUrl: req.body.websiteUrl || '',
            displayOrder: req.body.displayOrder || 0,
            status: req.body.status || 'active',
            startDate: req.body.startDate || null,
            endDate: req.body.endDate || null,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Sponsor created successfully',
            data: mapSponsor(sponsor),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getSponsors = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const filter = buildFilter(req.query, false);
        const total = await Sponsor.countDocuments(filter);
        let query = Sponsor.find(filter).sort({ displayOrder: 1, createdAt: -1 });
        let pagination = null;

        if (page && limit) {
            query = query.skip((page - 1) * limit).limit(limit);
            pagination = {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }

        const sponsors = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsors fetched successfully',
            data: sponsors.map(mapSponsor),
            pagination,
            meta: {
                totalSponsors: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getSponsorById = async (req, res) => {
    try {
        const sponsor = await Sponsor.findOne({
            _id: req.params.id,
            status: 'active',
            $and: [
                { $or: [{ startDate: null }, { startDate: { $lte: new Date() } }] },
                { $or: [{ endDate: null }, { endDate: { $gte: new Date() } }] },
            ],
        });

        if (!sponsor) {
            return res.status(status.NotFound).json({ success: false, message: 'Sponsor not found' });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsor fetched successfully',
            data: mapSponsor(sponsor),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getAdminSponsors = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filter = buildFilter(req.query, true);
        const total = await Sponsor.countDocuments(filter);
        const sponsors = await Sponsor.find(filter)
            .sort({ displayOrder: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsors fetched successfully',
            data: sponsors.map(mapSponsor),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getAdminSponsorById = async (req, res) => {
    try {
        const sponsor = await Sponsor.findById(req.params.id);

        if (!sponsor) {
            return res.status(status.NotFound).json({ success: false, message: 'Sponsor not found' });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsor fetched successfully',
            data: mapSponsor(sponsor),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.updateSponsor = async (req, res) => {
    try {
        const sponsor = await Sponsor.findById(req.params.id);

        if (!sponsor) {
            return res.status(status.NotFound).json({ success: false, message: 'Sponsor not found' });
        }

        ['name', 'location', 'websiteUrl', 'displayOrder', 'status', 'startDate', 'endDate'].forEach((field) => {
            if (req.body[field] !== undefined) sponsor[field] = req.body[field];
        });

        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'sponsors/logos');
            sponsor.logo = uploaded.fileName;
        }

        await sponsor.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsor updated successfully',
            data: mapSponsor(sponsor),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.deleteSponsor = async (req, res) => {
    try {
        const sponsor = await Sponsor.findByIdAndDelete(req.params.id);

        if (!sponsor) {
            return res.status(status.NotFound).json({ success: false, message: 'Sponsor not found' });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Sponsor permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

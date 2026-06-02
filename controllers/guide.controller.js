const Guide = require('../models/guide.model');
const GuideChapter = require('../models/guideChapter.model');
const GuideTakeaway = require('../models/guideTakeaway.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getGuideCoverImageUrl } = require('../utils/imagekitUrl');

const generateSlug = (value) => {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const getUniqueSlug = async (slug, excludeId = null) => {
    const baseSlug = generateSlug(slug) || `guide-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await Guide.exists({
        slug: uniqueSlug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return uniqueSlug;
};

const mapGuide = (guide) => {
    if (!guide) return null;
    const guideObj = typeof guide.toObject === 'function' ? guide.toObject() : guide;

    return {
        ...guideObj,
        coverImageUrl: guideObj.coverImage ? getGuideCoverImageUrl(guideObj.coverImage) : null,
    };
};

const getGuideDetails = async (guide) => {
    const [chapters, takeaways] = await Promise.all([
        GuideChapter.find({ guideId: guide._id }).sort({ sortOrder: 1, createdAt: 1 }),
        GuideTakeaway.find({ guideId: guide._id }).sort({ sortOrder: 1, createdAt: 1 }),
    ]);

    return {
        ...mapGuide(guide),
        chapters,
        takeaways,
    };
};

const buildGuideFilter = (query, isAdmin = false) => {
    const filter = {};

    if (isAdmin && query.status) {
        filter.status = query.status;
    }

    if (!isAdmin) {
        filter.status = 'published';
        filter.publishedAt = { $ne: null, $lte: new Date() };
    }

    if (query.isFeatured !== undefined) {
        filter.isFeatured = query.isFeatured;
    }

    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' } },
            { slug: { $regex: query.search, $options: 'i' } },
            { shortDescription: { $regex: query.search, $options: 'i' } },
            { authorName: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

exports.createGuide = async (req, res) => {
    try {
        const {
            title,
            shortDescription,
            views,
            status: guideStatus = 'draft',
            isFeatured = false,
        } = req.body;

        let coverImage = null;
        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'guides/covers');
            coverImage = uploaded.fileName;
        }

        const authorName = req.body.authorName || req.user.name || 'Admin';
        const slug = await getUniqueSlug(req.body.slug || title);
        const publishedAt = req.body.publishedAt || (guideStatus === 'published' ? new Date() : null);

        const guide = await Guide.create({
            title,
            slug,
            shortDescription,
            coverImage,
            authorName,
            adminId: req.user.id,
            views: views || 0,
            status: guideStatus,
            isFeatured,
            publishedAt,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Guide created successfully',
            data: mapGuide(guide),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Guide slug already exists' : error.message,
        });
    }
};

exports.getGuides = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const filter = buildGuideFilter(req.query, false);
        const total = await Guide.countDocuments(filter);
        let query = Guide.find(filter).sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 });
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

        const guides = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Guides fetched successfully',
            data: guides.map(mapGuide),
            pagination,
            meta: {
                totalGuides: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getGuideById = async (req, res) => {
    try {
        const guide = await Guide.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'published',
                publishedAt: { $ne: null, $lte: new Date() },
            },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!guide) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Guide not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Guide fetched successfully',
            data: await getGuideDetails(guide),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getGuideBySlug = async (req, res) => {
    try {
        const guide = await Guide.findOneAndUpdate(
            {
                slug: req.params.slug,
                status: 'published',
                publishedAt: { $ne: null, $lte: new Date() },
            },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!guide) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Guide not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Guide fetched successfully',
            data: await getGuideDetails(guide),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAdminGuides = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filter = buildGuideFilter(req.query, true);
        const total = await Guide.countDocuments(filter);
        const guides = await Guide.find(filter)
            .populate('adminId', 'name email phone role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(status.OK).json({
            success: true,
            message: 'Guides fetched successfully',
            data: guides.map(mapGuide),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAdminGuideById = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id).populate('adminId', 'name email phone role');

        if (!guide) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Guide not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Guide fetched successfully',
            data: await getGuideDetails(guide),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateGuide = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id);

        if (!guide) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Guide not found',
            });
        }

        const fields = ['title', 'shortDescription', 'authorName', 'views', 'status', 'isFeatured', 'publishedAt'];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) guide[field] = req.body[field];
        });

        if (req.body.slug !== undefined) {
            guide.slug = await getUniqueSlug(req.body.slug, guide._id);
        }

        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'guides/covers');
            guide.coverImage = uploaded.fileName;
        }

        if (req.body.status === 'published' && !guide.publishedAt) {
            guide.publishedAt = new Date();
        }

        if (req.body.status && req.body.status !== 'published' && req.body.publishedAt === undefined) {
            guide.publishedAt = null;
        }

        await guide.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Guide updated successfully',
            data: mapGuide(guide),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Guide slug already exists' : error.message,
        });
    }
};

exports.deleteGuide = async (req, res) => {
    try {
        const guide = await Guide.findByIdAndDelete(req.params.id);

        if (!guide) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Guide not found',
            });
        }

        await Promise.all([
            GuideChapter.deleteMany({ guideId: guide._id }),
            GuideTakeaway.deleteMany({ guideId: guide._id }),
        ]);

        return res.status(status.OK).json({
            success: true,
            message: 'Guide permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createChapter = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.guideId);
        if (!guide) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide not found' });
        }

        const chapter = await GuideChapter.create({
            guideId: guide._id,
            title: req.body.title,
            content: req.body.content,
            sortOrder: req.body.sortOrder || 0,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Guide chapter created successfully',
            data: chapter,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getChapters = async (req, res) => {
    try {
        const chapters = await GuideChapter.find({ guideId: req.params.guideId }).sort({ sortOrder: 1, createdAt: 1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Guide chapters fetched successfully',
            data: chapters,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.updateChapter = async (req, res) => {
    try {
        const chapter = await GuideChapter.findById(req.params.id);
        if (!chapter) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide chapter not found' });
        }

        ['title', 'content', 'sortOrder'].forEach((field) => {
            if (req.body[field] !== undefined) chapter[field] = req.body[field];
        });

        await chapter.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Guide chapter updated successfully',
            data: chapter,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.deleteChapter = async (req, res) => {
    try {
        const chapter = await GuideChapter.findByIdAndDelete(req.params.id);
        if (!chapter) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide chapter not found' });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Guide chapter permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.createTakeaway = async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.guideId);
        if (!guide) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide not found' });
        }

        const takeaway = await GuideTakeaway.create({
            guideId: guide._id,
            content: req.body.content,
            sortOrder: req.body.sortOrder || 0,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Guide takeaway created successfully',
            data: takeaway,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.getTakeaways = async (req, res) => {
    try {
        const takeaways = await GuideTakeaway.find({ guideId: req.params.guideId }).sort({ sortOrder: 1, createdAt: 1 });

        return res.status(status.OK).json({
            success: true,
            message: 'Guide takeaways fetched successfully',
            data: takeaways,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.updateTakeaway = async (req, res) => {
    try {
        const takeaway = await GuideTakeaway.findById(req.params.id);
        if (!takeaway) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide takeaway not found' });
        }

        ['content', 'sortOrder'].forEach((field) => {
            if (req.body[field] !== undefined) takeaway[field] = req.body[field];
        });

        await takeaway.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Guide takeaway updated successfully',
            data: takeaway,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

exports.deleteTakeaway = async (req, res) => {
    try {
        const takeaway = await GuideTakeaway.findByIdAndDelete(req.params.id);
        if (!takeaway) {
            return res.status(status.NotFound).json({ success: false, message: 'Guide takeaway not found' });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Guide takeaway permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({ success: false, message: error.message });
    }
};

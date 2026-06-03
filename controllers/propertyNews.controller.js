const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const PropertyNews = require('../models/propertyNews.model');
const LogLogin = require('../models/logLogin');
const { jwt: jwtConfig } = require('../config/auth');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getPropertyNewsCoverImageUrl, getPropertyNewsImageUrl } = require('../utils/imagekitUrl');

const generateSlug = (value) => {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const getUniqueSlug = async (slug, excludeId = null) => {
    const baseSlug = generateSlug(slug) || `property-news-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await PropertyNews.exists({
        slug: uniqueSlug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return uniqueSlug;
};

const mapPropertyNews = (news) => {
    if (!news) return null;
    const newsObj = typeof news.toObject === 'function' ? news.toObject() : news;

    return {
        ...newsObj,
        coverImageUrl: newsObj.coverImage ? getPropertyNewsCoverImageUrl(newsObj.coverImage) : null,
        imageUrls: Array.isArray(newsObj.images)
            ? newsObj.images.map((fileName) => getPropertyNewsImageUrl(fileName)).filter(Boolean)
            : [],
    };
};

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const rawAuthorizationToken = authHeader && !authHeader.startsWith('Bearer ') ? String(authHeader).trim() : null;
    const fallbackToken = req.headers['x-access-token'] || req.headers.token;

    return bearerToken || rawAuthorizationToken || fallbackToken || null;
};

const getOptionalAdmin = async (req) => {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
        if (!decoded.id || (decoded.role !== 'admin' && !decoded.isAdmin)) return null;

        const logLogin = await LogLogin.findOne({
            userId: new mongoose.Types.ObjectId(decoded.id),
            token,
            isLogin: true,
        }).sort({ createdAt: -1 });

        if (!logLogin) return null;

        return {
            id: decoded.id,
            role: decoded.role || null,
            isAdmin: decoded.isAdmin || false,
        };
    } catch (error) {
        return null;
    }
};

const buildFilter = (query, isAdminRequest = false) => {
    const filter = {};

    if (isAdminRequest && query.status) {
        filter.status = query.status;
    }

    if (!isAdminRequest) {
        filter.status = 'published';
        filter.publishedAt = { $ne: null, $lte: new Date() };
    }

    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' } },
            { summary: { $regex: query.search, $options: 'i' } },
            { content: { $regex: query.search, $options: 'i' } },
            { city: { $regex: query.search, $options: 'i' } },
            { source: { $regex: query.search, $options: 'i' } },
            { authorName: { $regex: query.search, $options: 'i' } },
        ];
    }

    if (query.city) {
        filter.city = { $regex: query.city, $options: 'i' };
    }

    if (query.source) {
        filter.source = { $regex: query.source, $options: 'i' };
    }

    if (query.isFeatured !== undefined) {
        filter.isFeatured = query.isFeatured;
    }

    return filter;
};

exports.createPropertyNews = async (req, res) => {
    try {
        const {
            title,
            summary,
            content,
            city,
            source = '',
            views,
            status: newsStatus = 'draft',
            isFeatured = false,
        } = req.body;

        let coverImage = null;
        if (req.files?.coverImage?.[0]) {
            const uploaded = await uploadToImagekit(req.files.coverImage[0], 'property-news/covers');
            coverImage = uploaded.fileName;
        }

        const images = [];
        if (req.files?.images?.length) {
            for (const file of req.files.images) {
                const uploaded = await uploadToImagekit(file, 'property-news/images');
                images.push(uploaded.fileName);
            }
        }

        const authorName = req.body.authorName || req.user.name || 'Admin';
        const slug = await getUniqueSlug(req.body.slug || title);
        const publishedAt = req.body.publishedAt || (newsStatus === 'published' ? new Date() : null);

        const propertyNews = await PropertyNews.create({
            title,
            slug,
            summary,
            content,
            coverImage,
            images,
            city,
            source,
            authorName,
            adminId: req.user.id,
            views: views || 0,
            status: newsStatus,
            isFeatured,
            publishedAt,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Property news created successfully',
            data: mapPropertyNews(propertyNews),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Property news slug already exists' : error.message,
        });
    }
};

exports.getPropertyNews = async (req, res) => {
    try {
        const adminUser = await getOptionalAdmin(req);
        const isAdminRequest = Boolean(adminUser);
        const { page, limit } = req.query;
        const filter = buildFilter(req.query, isAdminRequest);

        const total = await PropertyNews.countDocuments(filter);
        let query = PropertyNews.find(filter).sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 });
        let pagination = null;

        if (isAdminRequest) {
            query = query.populate('adminId', 'name email phone role');
        }

        if (page && limit) {
            query = query.skip((page - 1) * limit).limit(limit);
            pagination = {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }

        const propertyNews = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Property news fetched successfully',
            data: propertyNews.map(mapPropertyNews),
            pagination,
            meta: {
                totalPropertyNews: total,
                mode: isAdminRequest ? 'admin' : 'public',
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getPropertyNewsById = async (req, res) => {
    try {
        const adminUser = await getOptionalAdmin(req);
        const isAdminRequest = Boolean(adminUser);

        const filter = { _id: req.params.id };
        if (!isAdminRequest) {
            filter.status = 'published';
            filter.publishedAt = { $ne: null, $lte: new Date() };
        }

        const query = isAdminRequest
            ? PropertyNews.findOne(filter).populate('adminId', 'name email phone role')
            : PropertyNews.findOneAndUpdate(filter, { $inc: { views: 1 } }, { new: true });

        const propertyNews = await query;

        if (!propertyNews) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property news not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Property news fetched successfully',
            data: mapPropertyNews(propertyNews),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updatePropertyNews = async (req, res) => {
    try {
        const propertyNews = await PropertyNews.findById(req.params.id);

        if (!propertyNews) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property news not found',
            });
        }

        const fields = ['title', 'summary', 'content', 'city', 'source', 'authorName', 'views', 'status', 'isFeatured', 'publishedAt'];
        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                propertyNews[field] = req.body[field];
            }
        });

        if (req.body.slug !== undefined) {
            propertyNews.slug = await getUniqueSlug(req.body.slug, propertyNews._id);
        }

        if (req.files?.coverImage?.[0]) {
            const uploaded = await uploadToImagekit(req.files.coverImage[0], 'property-news/covers');
            propertyNews.coverImage = uploaded.fileName;
        }

        if (req.files?.images?.length) {
            const uploadedImages = [];
            for (const file of req.files.images) {
                const uploaded = await uploadToImagekit(file, 'property-news/images');
                uploadedImages.push(uploaded.fileName);
            }
            propertyNews.images = uploadedImages;
        }

        if (req.body.status === 'published' && !propertyNews.publishedAt) {
            propertyNews.publishedAt = new Date();
        }

        if (req.body.status && req.body.status !== 'published' && req.body.publishedAt === undefined) {
            propertyNews.publishedAt = null;
        }

        await propertyNews.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Property news updated successfully',
            data: mapPropertyNews(propertyNews),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Property news slug already exists' : error.message,
        });
    }
};

exports.deletePropertyNews = async (req, res) => {
    try {
        const propertyNews = await PropertyNews.findByIdAndDelete(req.params.id);

        if (!propertyNews) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Property news not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Property news permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

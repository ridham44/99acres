const Blog = require('../models/blog.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getBlogCoverImageUrl } = require('../utils/imagekitUrl');

const generateSlug = (value) => {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const getUniqueSlug = async (slug, excludeId = null) => {
    const baseSlug = generateSlug(slug) || `blog-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await Blog.exists({
        slug: uniqueSlug,
        deletedAt: null,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter += 1;
    }

    return uniqueSlug;
};

const mapBlog = (blog) => {
    if (!blog) return null;
    const blogObj = typeof blog.toObject === 'function' ? blog.toObject() : blog;

    return {
        ...blogObj,
        coverImageUrl: blogObj.coverImage ? getBlogCoverImageUrl(blogObj.coverImage) : null,
    };
};

const buildBlogFilter = (query, includeStatus = false) => {
    const filter = { deletedAt: null };

    if (includeStatus && query.status) {
        filter.status = query.status;
    }

    if (query.category) {
        filter.category = { $regex: query.category, $options: 'i' };
    }

    if (query.isFeatured !== undefined) {
        filter.isFeatured = query.isFeatured;
    }

    if (query.search) {
        filter.$or = [
            { title: { $regex: query.search, $options: 'i' } },
            { summary: { $regex: query.search, $options: 'i' } },
            { category: { $regex: query.search, $options: 'i' } },
            { authorName: { $regex: query.search, $options: 'i' } },
        ];
    }

    return filter;
};

exports.createBlog = async (req, res) => {
    try {
        const {
            title,
            summary,
            content,
            category,
            views,
            status: blogStatus = 'draft',
            isFeatured = false,
        } = req.body;

        let coverImage = null;
        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'blogs/covers');
            coverImage = uploaded.fileName;
        }

        const authorName = req.body.authorName || req.user.name || 'Admin';
        const slug = await getUniqueSlug(req.body.slug || title);
        const publishedAt = req.body.publishedAt || (blogStatus === 'published' ? new Date() : null);

        const blog = await Blog.create({
            title,
            slug,
            summary,
            content,
            coverImage,
            category,
            authorName,
            adminId: req.user.id,
            views: views || 0,
            status: blogStatus,
            isFeatured,
            publishedAt,
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Blog created successfully',
            data: mapBlog(blog),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Blog slug already exists' : error.message,
        });
    }
};

exports.getBlogs = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const filter = {
            ...buildBlogFilter(req.query),
            status: 'published',
            publishedAt: {
                $ne: null,
                $lte: new Date(),
            },
        };

        const total = await Blog.countDocuments(filter);

        let query = Blog.find(filter)
            .sort({
                isFeatured: -1,
                publishedAt: -1,
                createdAt: -1,
            });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);

            query = query
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const blogs = await query;

        return res.status(status.OK).json({
            success: true,
            message: 'Blogs fetched successfully',
            data: blogs.map(mapBlog),
            pagination,
            meta: {
                totalBlogs: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            {
                _id: req.params.id,
                deletedAt: null,
                status: 'published',
                publishedAt: { $ne: null, $lte: new Date() },
            },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!blog) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Blog not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Blog fetched successfully',
            data: mapBlog(blog),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            {
                slug: req.params.slug,
                deletedAt: null,
                status: 'published',
                publishedAt: { $ne: null, $lte: new Date() },
            },
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!blog) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Blog not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Blog fetched successfully',
            data: mapBlog(blog),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getAdminBlogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filter = buildBlogFilter(req.query, true);

        const total = await Blog.countDocuments(filter);
        const blogs = await Blog.find(filter)
            .populate('adminId', 'name email phone role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(status.OK).json({
            success: true,
            message: 'Blogs fetched successfully',
            data: blogs.map(mapBlog),
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

exports.getAdminBlogById = async (req, res) => {
    try {
        const blog = await Blog.findOne({ _id: req.params.id, deletedAt: null })
            .populate('adminId', 'name email phone role');

        if (!blog) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Blog not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Blog fetched successfully',
            data: mapBlog(blog),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findOne({ _id: req.params.id, deletedAt: null });

        if (!blog) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Blog not found',
            });
        }

        const fields = ['title', 'summary', 'content', 'category', 'authorName', 'views', 'status', 'isFeatured', 'publishedAt'];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) {
                blog[field] = req.body[field];
            }
        });

        if (req.body.slug !== undefined) {
            blog.slug = await getUniqueSlug(req.body.slug, blog._id);
        }

        if (req.file) {
            const uploaded = await uploadToImagekit(req.file, 'blogs/covers');
            blog.coverImage = uploaded.fileName;
        }

        if (req.body.status === 'published' && !blog.publishedAt) {
            blog.publishedAt = new Date();
        }

        if (req.body.status && req.body.status !== 'published' && req.body.publishedAt === undefined) {
            blog.publishedAt = null;
        }

        await blog.save();

        return res.status(status.OK).json({
            success: true,
            message: 'Blog updated successfully',
            data: mapBlog(blog),
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.code === 11000 ? 'Blog slug already exists' : error.message,
        });
    }
};

exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findOneAndDelete(
            { _id: req.params.id, deletedAt: null },
        );

        if (!blog) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Blog not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Blog permanently deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

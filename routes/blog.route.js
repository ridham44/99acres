const express = require('express');
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/blog.controller');
const validation = require('../validation/blog.validation');
const upload = require('../utils/blogCoverImageMulter');

const router = express.Router();

router.post(
    '/admin',
    auth,
    admin,
    upload.single('coverImage'),
    validation.validateCreateBlog,
    controller.createBlog
);

router.get('/admin', auth, admin, validation.validateGetBlogs, controller.getAdminBlogs);
router.get('/admin/:id', auth, admin, validation.validateBlogId, controller.getAdminBlogById);

router.put(
    '/admin/:id',
    auth,
    admin,
    upload.single('coverImage'),
    validation.validateUpdateBlog,
    controller.updateBlog
);

router.delete('/admin/:id', auth, admin, validation.validateBlogId, controller.deleteBlog);

router.get('/', validation.validateGetBlogs, controller.getBlogs);
router.get('/slug/:slug', controller.getBlogBySlug);
router.get('/:id', validation.validateBlogId, controller.getBlogById);

module.exports = router;

const PrivacyPolicy = require('../models/privacyPolicy.model');
const status = require('../utils/statusCodes');

// ─────────────────────────────────────────────────────────────
//  DEFAULT HTML CONTENT (seeded on first create if none exists)
// ─────────────────────────────────────────────────────────────
const DEFAULT_CONTENT = `
<h1>Privacy Policy</h1>

<p><strong>Last Updated:</strong> January 22, 2026</p>

<hr />

<h2>Welcome to RealEstate</h2>
<p>
  RealEstate is India's No. 1 Property Portal. We value your privacy and are
  committed to protecting your personal data. This Privacy Policy explains how
  we collect, use, and share information.
</p>

<hr />

<h3>01. Information We Collect</h3>
<p>
  We collect personal information such as name, email, phone number, and account
  details provided during registration. We also collect technical data like IP
  address, device type, and usage behavior.
</p>

<h3>02. Use of Information</h3>
<p>
  Your data is used to operate, maintain, and improve our services, personalize
  user experience, communicate updates, and provide customer support.
</p>

<h3>03. Information Sharing</h3>
<p>
  RealEstate does not sell personal data. Information may be shared with trusted
  partners or legal authorities when required by law.
</p>

<h3>04. Data Security</h3>
<p>
  We implement reasonable technical and organizational measures to protect your
  information against unauthorized access or disclosure.
</p>

<h3>05. User Rights</h3>
<p>
  You may access, update, or request deletion of your personal information by
  contacting us or through your account settings.
</p>

<hr />

<div class="important-notice">
  <strong>Consent</strong>
  <p>By using RealEstate, you agree to this Privacy Policy.</p>
</div>

<hr />

<h2>Contact Us</h2>
<p>
  If you have any questions about this Privacy Policy or your personal
  information, please reach out to us at:
</p>
<ul>
  <li><strong>Email:</strong> legal@RealEstate.com</li>
  <li><strong>Phone:</strong> +91-22-1234-5678</li>
  <li><strong>Location:</strong> RealEstate, Mumbai, India</li>
</ul>
`.trim();

// ─────────────────────────────────────────────────────────────
//  USER-SIDE  (Public)
// ─────────────────────────────────────────────────────────────

// GET /privacy-policy  — returns the currently active policy
exports.getActivePrivacyPolicy = async (req, res) => {
    try {
        let policy = await PrivacyPolicy.findOne({ isActive: true, deletedAt: null }).sort({ createdAt: -1 });

        // If no active policy exists, return the default one instead of 404
        if (!policy) {
            return res.status(status.OK).json({
                success: true,
                data: {
                    title: 'Privacy Policy',
                    content: DEFAULT_CONTENT,
                    isActive: true,
                    isDefault: true
                },
            });
        }

        return res.status(status.OK).json({
            success: true,
            data: policy,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN-SIDE  (Protected — admin only)
// ─────────────────────────────────────────────────────────────

// POST /admin/privacy-policy
exports.createPrivacyPolicy = async (req, res) => {
    try {
        const { title, content, isActive } = req.body;

        // If this new policy is active, deactivate previous ones
        if (isActive !== false) {
            await PrivacyPolicy.updateMany({ deletedAt: null }, { isActive: false });
        }

        const policy = await PrivacyPolicy.create({
            title: title || 'Privacy Policy',
            content: content || DEFAULT_CONTENT,
            isActive: isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Privacy policy created successfully',
            data: policy,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// GET /admin/privacy-policy  — paginated list of all versions
exports.getAllPrivacyPolicies = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;

        const filter = { deletedAt: null };
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (Number(page) - 1) * Number(limit);
        const [policies, total] = await Promise.all([
            PrivacyPolicy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            PrivacyPolicy.countDocuments(filter),
        ]);

        return res.status(status.OK).json({
            success: true,
            data: policies,
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

// GET /admin/privacy-policy/:id
exports.getPrivacyPolicyById = async (req, res) => {
    try {
        const policy = await PrivacyPolicy.findOne({ _id: req.params.id, deletedAt: null });

        if (!policy) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Privacy policy not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            data: policy,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// PUT /admin/privacy-policy/:id
exports.updatePrivacyPolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, isActive } = req.body;

        const policy = await PrivacyPolicy.findOne({ _id: id, deletedAt: null });

        if (!policy) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Privacy policy not found',
            });
        }

        // If activating this record, deactivate all others
        if (isActive === true || isActive === 'true') {
            await PrivacyPolicy.updateMany({ _id: { $ne: id }, deletedAt: null }, { isActive: false });
        }

        const updateData = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';

        const updated = await PrivacyPolicy.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(status.OK).json({
            success: true,
            message: 'Privacy policy updated successfully',
            data: updated,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// DELETE /admin/privacy-policy/:id  (Soft Delete)
exports.deletePrivacyPolicy = async (req, res) => {
    try {
        const policy = await PrivacyPolicy.findOne({ _id: req.params.id, deletedAt: null });

        if (!policy) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Privacy policy not found',
            });
        }

        await PrivacyPolicy.findByIdAndUpdate(req.params.id, {
            deletedAt: new Date(),
            isActive: false,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Privacy policy deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

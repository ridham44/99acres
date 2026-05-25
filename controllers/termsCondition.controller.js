const TermsCondition = require('../models/termsCondition.model');
const status = require('../utils/statusCodes');

// ─────────────────────────────────────────────────────────────
//  DEFAULT HTML CONTENT (seeded on first create if none exists)
// ─────────────────────────────────────────────────────────────
const DEFAULT_CONTENT = `
<h1>Terms &amp; Conditions</h1>

<p><strong>Last Updated:</strong> January 22, 2026</p>
<p><strong>Version:</strong> v3.2.1</p>

<hr />

<h2>Welcome to RealEstate</h2>
<p>
  RealEstate is India's No. 1 Property Portal. By accessing our platform, you
  agree to our Terms &amp; Conditions. Please read them carefully.
</p>

<hr />

<h3>01. General Terms &amp; Conditions</h3>
<p>
  These General Terms &amp; Conditions constitute a legally binding agreement
  between you and <strong>RealEstate</strong> regarding your use of our
  platform, including the website
  <a href="http://www.RealEstate.com">www.RealEstate.com</a> and any Services
  offered or made available by RealEstate.
</p>

<h3>02. User Agreement</h3>
<p>
  By using the Site and Services, you agree to be bound by these Terms. Your
  continued use of the platform constitutes acceptance of any updates or
  modifications to these Terms.
</p>

<h3>03. Privacy &amp; Data</h3>
<p>
  We are committed to protecting your privacy. Our Privacy Policy explains how
  we collect, use, and protect your personal information. By using our services,
  you consent to such processing.
</p>

<h3>04. Service Terms</h3>
<p>
  RealEstate provides a platform for property listings, searches, and related
  services. We do not guarantee the accuracy of listings and are not responsible
  for transactions between users.
</p>

<hr />

<div class="warning-notice">
  <strong>Important Notice</strong>
  <p>
    These Terms may be updated periodically. Continued use of our services after
    updates constitutes acceptance of the revised Terms.
  </p>
</div>

<div class="important-notice">
  <strong>Acceptance of Terms</strong>
  <p>
    By continuing to use RealEstate, you acknowledge that you have read,
    understood, and agree to be bound by these Terms &amp; Conditions.
  </p>
</div>

<hr />

<h2>Contact Us</h2>
<p>
  If you have any questions or require legal clarifications regarding these
  Terms, please contact us at:
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

// GET /terms-conditions  — returns the currently active T&C
exports.getActiveTerms = async (req, res) => {
    try {
        let terms = await TermsCondition.findOne({ isActive: true, deletedAt: null }).sort({ createdAt: -1 });

        // If no active terms exists, return the default one instead of 404
        if (!terms) {
            return res.status(status.OK).json({
                success: true,
                data: {
                    title: 'Terms & Conditions',
                    content: DEFAULT_CONTENT,
                    isActive: true,
                    isDefault: true
                },
            });
        }

        return res.status(status.OK).json({
            success: true,
            data: terms,
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

// POST /admin/terms-conditions
exports.createTerms = async (req, res) => {
    try {
        const { title, content, isActive } = req.body;

        // If this new record is active, deactivate all previous ones
        if (isActive !== false) {
            await TermsCondition.updateMany({ deletedAt: null }, { isActive: false });
        }

        const terms = await TermsCondition.create({
            title: title || 'Terms & Conditions',
            content: content || DEFAULT_CONTENT,
            isActive: isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return res.status(status.CREATED).json({
            success: true,
            message: 'Terms & Conditions created successfully',
            data: terms,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// GET /admin/terms-conditions  — paginated list of all versions
exports.getAllTerms = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;

        const filter = { deletedAt: null };
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (Number(page) - 1) * Number(limit);
        const [termsList, total] = await Promise.all([
            TermsCondition.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            TermsCondition.countDocuments(filter),
        ]);

        return res.status(status.OK).json({
            success: true,
            data: termsList,
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

// GET /admin/terms-conditions/:id
exports.getTermsById = async (req, res) => {
    try {
        const terms = await TermsCondition.findOne({ _id: req.params.id, deletedAt: null });

        if (!terms) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Terms & Conditions not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            data: terms,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// PUT /admin/terms-conditions/:id
exports.updateTerms = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, isActive } = req.body;

        const terms = await TermsCondition.findOne({ _id: id, deletedAt: null });

        if (!terms) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Terms & Conditions not found',
            });
        }

        // If activating this record, deactivate all others
        if (isActive === true || isActive === 'true') {
            await TermsCondition.updateMany({ _id: { $ne: id }, deletedAt: null }, { isActive: false });
        }

        const updateData = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';

        const updated = await TermsCondition.findByIdAndUpdate(id, updateData, { new: true });

        return res.status(status.OK).json({
            success: true,
            message: 'Terms & Conditions updated successfully',
            data: updated,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// DELETE /admin/terms-conditions/:id  (Soft Delete)
exports.deleteTerms = async (req, res) => {
    try {
        const terms = await TermsCondition.findOne({ _id: req.params.id, deletedAt: null });

        if (!terms) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Terms & Conditions not found',
            });
        }

        await TermsCondition.findByIdAndUpdate(req.params.id, {
            deletedAt: new Date(),
            isActive: false,
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Terms & Conditions deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

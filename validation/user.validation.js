const status = require('../utils/statusCodes');

const nameRegex = /^[A-Za-z\s]+$/;
const phoneRegex = /^[0-9]{10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validateGetProfile = (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(status.Unauthorized).json({
                success: false,
                message: 'Unauthorized access',
            });
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.validateUpdateProfile = (req, res, next) => {
    try {
        const { name, phone, email, agencyName } = req.body;

        const allowedFields = ['name', 'phone', 'email', 'agencyName'];
        const requestFields = Object.keys(req.body);

        const isValidField = requestFields.every((field) => allowedFields.includes(field));

        if (!isValidField) {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Invalid fields in request',
            });
        }

        if (name !== undefined) {
            if (!nameRegex.test(name)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Name must contain only alphabets',
                });
            }
        }

        if (phone !== undefined) {
            if (!phoneRegex.test(phone)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Phone number must be 10 digits',
                });
            }
        }

        if (email !== undefined) {
            if (!emailRegex.test(email)) {
                return res.status(status.BadRequest).json({
                    success: false,
                    message: 'Invalid email format',
                });
            }
        }

        if (agencyName !== undefined && agencyName.trim() === '') {
            return res.status(status.BadRequest).json({
                success: false,
                message: 'Agency name cannot be empty',
            });
        }

        next();
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

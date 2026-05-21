const User = require('../models/user.model');
const status = require('../utils/statusCodes');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-__v');

        return res.status(status.OK).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });

        return res.status(status.OK).json({
            success: true,
            message: 'Profile updated',
            data: user,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

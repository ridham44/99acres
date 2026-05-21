const status = require('./statusCodes');

exports.success = (res, message, data = null, code = status.OK) => {
    return res.status(code).json({
        success: true,
        message,
        data,
    });
};

exports.error = (res, message, code = status.BadRequest) => {
    return res.status(code).json({
        success: false,
        message,
    });
};

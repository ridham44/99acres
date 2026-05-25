const mongoose = require('mongoose');

const supportContactSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    availability: {
        type: String,
        required: true,
        default: "24/7"
    }
}, { timestamps: true });

module.exports = mongoose.model('SupportContact', supportContactSchema);

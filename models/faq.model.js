const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
    {
        topicId: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ['buy', 'rent', 'sell', 'property', 'payment', 'subscription', 'account', 'broker', 'builder', 'general'],
            required: true,
        },
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('FAQ', faqSchema);

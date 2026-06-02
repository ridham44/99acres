const mongoose = require('mongoose');

const guideTakeawaySchema = new mongoose.Schema(
    {
        guideId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guide',
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('GuideTakeaway', guideTakeawaySchema);

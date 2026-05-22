const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },

        propertiesListed: {
            type: Number,
            default: 0,
            min: 0,
        },

        verifiedProperties: {
            type: Number,
            default: 0,
            min: 0,
        },

        expertInAreas: [
            {
                type: String,
                trim: true,
            },
        ],

        companyName: {
            type: String,
            trim: true,
            default: '',
        },

        companyImage: {
            type: String,
            trim: true,
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

agentSchema.index({ expertInAreas: 1 });

module.exports = mongoose.model('Agent', agentSchema);

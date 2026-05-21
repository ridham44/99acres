const mongoose = require('mongoose');

const propertyVisitSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        visitCount: {
            type: Number,
            default: 1,
            min: 1,
        },

        lastVisitedAt: {
            type: Date,
            default: Date.now,
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    },
);

propertyVisitSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
propertyVisitSchema.index({ userId: 1, lastVisitedAt: -1 });
propertyVisitSchema.index({ propertyId: 1, visitCount: -1 });

module.exports = mongoose.model('PropertyVisit', propertyVisitSchema);

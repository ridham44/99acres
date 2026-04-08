const mongoose = require('mongoose');

const propertyDocumentSchema = new mongoose.Schema(
    {
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true,
        },

        documentType: {
            type: String,
            enum: ['Ownership Proof', 'Agreement', 'Floor Plan', 'Brochure', 'Property Tax Receipt', 'ID Proof', 'Other'],
            required: true,
        },

        title: {
            type: String,
            trim: true,
            required: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        fileSize: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        updatedAt: {
            type: Date,
            default: Date.now,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        versionKey: false,
    },
);

propertyDocumentSchema.pre('save', function () {
    this.updatedAt = new Date();
});

propertyDocumentSchema.pre('findOneAndUpdate', function () {
    this.set({ updatedAt: new Date() });
});

module.exports = mongoose.model('PropertyDocument', propertyDocumentSchema);
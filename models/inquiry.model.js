const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
    {
        // The authenticated user who submitted the inquiry
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Property the inquiry is for
        property_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },

        // Dynamic location fields populated from the property at submission time
        city: {
            type: String,
            trim: true,
            default: null,
        },

        city_area: {
            type: String,
            trim: true,
            default: null,
        },

        // User-supplied contact details
        username: {
            type: String,
            required: true,
            trim: true,
        },

        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            match: [/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6-9'],
        },

        isAgent: {
            type: String,
            enum: ['Yes', 'No'],
            default: 'No',
        },

        // Inquiry open (true) / closed or resolved (false)
        status: {
            type: Boolean,
            default: true,
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
    { timestamps: false },
);

module.exports = mongoose.model('Inquiry', inquirySchema);

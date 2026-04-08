const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        dealerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        propertyName: {
            type: String,
            required: true,
            trim: true,
        },

        propertyCategory: {
            type: String,
            enum: ['Residential', 'Commercial', 'PG'],
            required: true,
        },

        propertyType: {
            type: String,
            required: true,
            trim: true,
        },

        listingType: {
            type: String,
            enum: ['Sale', 'Rent'],
            required: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        locality: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        priceUnit: {
            type: String,
            enum: ['total', 'monthly'],
            default: 'total',
        },

        area: {
            type: Number,
            required: true,
            min: 0,
        },

        measureType: {
            type: String,
            enum: ['sqft', 'sqmt', 'yard', 'bigha'],
            default: 'sqft',
        },

        carpetArea: {
            type: Number,
            default: 0,
            min: 0,
        },

        bedrooms: {
            type: Number,
            default: 0,
            min: 0,
        },

        bathrooms: {
            type: Number,
            default: 0,
            min: 0,
        },

        balcony: {
            type: Number,
            default: 0,
            min: 0,
        },

        furnished: {
            type: String,
            enum: ['No', 'Semi', 'Yes'],
            default: 'No',
        },

        parking: {
            type: Boolean,
            default: false,
        },

        lift: {
            type: Boolean,
            default: false,
        },

        floor: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalFloors: {
            type: Number,
            default: 0,
            min: 0,
        },

        facing: {
            type: String,
            trim: true,
            default: '',
        },

        propertyAge: {
            type: String,
            trim: true,
            default: '',
        },

        availableFor: {
            type: String,
            enum: ['Family', 'Bachelors', 'Anyone', 'Boys', 'Girls'],
            default: 'Anyone',
        },

        agreementMonths: {
            type: Number,
            default: 0,
            min: 0,
        },

        deposit: {
            type: Number,
            default: 0,
            min: 0,
        },

        maintenance: {
            type: Number,
            default: 0,
            min: 0,
        },

        possession: {
            type: String,
            trim: true,
            default: '',
        },

        description: {
            type: String,
            trim: true,
            default: '',
        },

        amenityIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Amenity',
            },
        ],

        furnishings: [
            {
                furnishingId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Furniture',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],

        nearbyPlaces: [
            {
                nearbyId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'NearbyPlace',
                    required: true,
                },
                distance: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                distanceUnit: {
                    type: String,
                    enum: ['m', 'km'],
                    default: 'km',
                },
            },
        ],
        media: [
            {
                fileName: {
                    type: String,
                    default: null,
                },
                type: {
                    type: String,
                    enum: ['image', 'video'],
                    required: true,
                },
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        status: {
            type: String,
            enum: ['Draft', 'Active', 'Inactive', 'Sold', 'Rented'],
            default: 'Draft',
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
        timestamps: false,
    },
);

module.exports = mongoose.model('Property', propertySchema);

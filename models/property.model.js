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

        city_area:{
            type:String,
            required:true,
            trim:true,
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

        coverImage: {
            type: String,
            default: null,
        },

        ownership: {
            type: String,
            trim: true,
            default: '',
        },

        flooring: {
            type: String,
            trim: true,
            default: '',
        },

        waterSource: {
            type: String,
            trim: true,
            default: '',
        },

        otherKeyFacilities: {
            type: String,
            trim: true,
            default: '',
        },

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

        // --- Technical Audit Fields ---
        nearbyLandmarks: [
            {
                category: String,
                icon: String,
                places: [{ name: String, distance: String }]
            }
        ],

        locationCoordinates: {
            latitude: Number,
            longitude: Number
        },

        keyHighlights: {
            propertyFeatures: [String],
            projectHighlights: [String]
        },

        floorPlans: [
            {
                bhk: String,
                superArea: String,
                price: String,
                estimatedEmi: String,
                possessionDate: String,
                imageUrl: String
            }
        ],

        legalCertificates: [
            {
                name: String,
                isAvailable: { type: Boolean, default: false },
                documentUrl: String,
                previewImageUrl: String,
                lastUpdated: String,
            }
        ],

        propWorthInsights: {
            currentLocality: String,
            localityTrend: [Number],
            projectTrend: [Number],
            timeframe: String
        },

        aiSummary: String,

        reviewTopics: [String],

        preLeasedDetails: {
            leaseAmount: String,
            leaseTenure: String
        },

        approvedIndustryTypes: [String],

        keySpecifications: [
            { label: String, value: String }
        ],

        projectDetails: {
            projectName: String,
            landZone: String,
            reraNumber: String,
            passengerLifts: String,
            serviceLifts: String,
            occupancyCertificate: String,
            fireNoc: String
        },

        aboutProject: {
            name: String,
            priceRange: String,
            totalUnits: Number
        },

        aboutLocality: {
            name: String,
            pincode: String,
            rating: Number,
            totalReviews: Number
        },

        aboutDeveloper: {
            name: String,
            experienceYears: Number,
            officeAddress: String
        },

        topAgents: [
            {
                name: String,
                agency: String,
                experience: String,
                buyersServed: Number,
                propertiesForSale: Number,
                propertiesForRent: Number,
                avatarUrl: String
            }
        ],

        // --- New Fields for Flutter Detail Pages ---

        specifications: [String],

        whyConsider: [String],

        preels: [
            {
                imageUrl: String,
                title: String,
                location: String,
                views: { type: Number, default: 0 },
                videoUrl: String,
            }
        ],

        expertReviews: [
            {
                videoThumbnail: String,
                videoUrl: String,
                reviewerName: String,
                channelName: String,
                subscribers: { type: Number, default: 0 },
                views: { type: Number, default: 0 },
            }
        ],

        projectInfo: {
            priceRange: {
                min: Number,
                max: Number,
            },
            totalUnits: Number,
        },

        localityInfo: {
            name: String,
            city: String,
            pincode: String,
            rating: Number,
            reviewCount: Number,
        },

        developerInfo: {
            name: String,
            yearsExperience: Number,
            address: String,
        },

        viewStats: {
            viewCount: { type: Number, default: 0 },
            daysPeriod: { type: Number, default: 30 },
        },

        // ── Builder-only Fields (visible to builder & admin roles only) ─────────

        availableUnits: [
            {
                bhk:                 String,   // e.g. "2 BHK Apartment"
                bookingType:         String,   // e.g. "New Bookings" | "Resale"
                brokerage:           String,   // e.g. "Zero Brokerage"
                sizeRange:           String,   // e.g. "617 - 629 sqft (57 - 58 sqm)"
                areaType:            String,   // e.g. "Carpet Area"
                price:               String,   // e.g. "₹58.5 Lac onwards"
                priceSqft:           String,   // e.g. "₹4,200 /sqft"
                optionsCount:        { type: Number, default: 0 },
                updatedText:         String,   // e.g. "Updated 2 mo. ago"
                paymentPlan:         String,   // e.g. "Construction-linked Plan"
                paymentPlanSubtitle: String,   // e.g. "Payment Plans & banks"
            }
        ],

        developer: {
            name:                  String,   // e.g. "Vivaan Group"
            logo:                  String,   // ImageKit fileName or full URL
            experience:            String,   // e.g. "13"
            totalProjects:         String,   // e.g. "8"
            cities:                String,   // e.g. "1"
            description:           String,   // About the builder
            deliveredCount:        String,   // e.g. "3"
            recentlyDeliveredCount: String,  // e.g. "3"
            ongoingCount:          String,   // e.g. "5"
        },
    },
    {
        timestamps: false,
    },
);

module.exports = mongoose.model('Property', propertySchema);

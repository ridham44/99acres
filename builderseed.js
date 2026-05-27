require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('./models/property.model');

const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority';

const BUILDER_ID = '6a169fb0bbb7f0be8ce9144a';

const amenityIds = [
    '6a145f44fcd3b87ed424e739',
    '6a0ea41ae194ff9a92e42423',
    '6a0ea408e194ff9a92e4241b',
    '6a0ea3f8e194ff9a92e42413',
];

const furnishingIds = [
    '6a145f44fcd3b87ed424e73a',
    '6a0ea554e194ff9a92e42489',
    '6a0ea54ce194ff9a92e42485',
    '6a0ea543e194ff9a92e42481',
];

const nearbyPlaceIds = [
    '6a0eb1e811a08f82bfa481c5',
    '6a0eb1e811a08f82bfa481d1',
    '6a0eb1e811a08f82bfa481c4',
    '6a0ea5ace194ff9a92e4249f',
];

const builderProperties = [
    {
        _id: '6a170001bbb7f0be8ce9144b',
        title: 'Vivaan Aura 2 & 3 BHK Apartments in Gota, Ahmedabad',
        propertyName: 'Vivaan Aura',
        propertyCategory: 'Residential',
        propertyType: 'Apartment',
        listingType: 'Sale',
        city: 'Ahmedabad',
        city_area: 'Gota',
        state: 'Gujarat',
        locality: 'Gota',
        address: 'Vivaan Aura, Near SG Highway, Gota, Ahmedabad, Gujarat',
        price: 5850000,
        priceUnit: 'total',
        area: 1250,
        carpetArea: 860,
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        furnished: 'No',
        floor: 6,
        totalFloors: 14,
        facing: 'East',
        propertyAge: 'Under Construction',
        possession: 'Dec, 2027',
        imageFileName: 'flat.jpeg',
        coverImage: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        description:
            'Vivaan Aura is a builder-posted residential project in Gota with efficient 2 and 3 BHK layouts, modern amenities, and construction-linked payment options.',
        availableUnits: [
            {
                bhk: '2 BHK Apartment',
                bookingType: 'New Bookings',
                brokerage: 'Zero Brokerage',
                sizeRange: '617 - 629 sqft (57 - 58 sqm)',
                areaType: 'Carpet Area',
                price: 'Rs 58.5 Lac onwards',
                priceSqft: 'Rs 4,680 /sqft',
                optionsCount: 8,
                updatedText: 'Updated 2 mo. ago',
                paymentPlan: 'Construction-linked Plan',
                paymentPlanSubtitle: 'Payment Plans & banks',
            },
            {
                bhk: '3 BHK Apartment',
                bookingType: 'New Bookings',
                brokerage: 'Zero Brokerage',
                sizeRange: '812 - 846 sqft (75 - 79 sqm)',
                areaType: 'Carpet Area',
                price: 'Rs 78.9 Lac onwards',
                priceSqft: 'Rs 5,020 /sqft',
                optionsCount: 6,
                updatedText: 'Updated 1 mo. ago',
                paymentPlan: 'Construction-linked Plan',
                paymentPlanSubtitle: 'Payment Plans & banks',
            },
        ],
        developer: {
            name: 'Vivaan Group',
            logo: '1779867566748-scaled_71490.jpg',
            experience: '13',
            totalProjects: '8',
            cities: '1',
            description:
                'Vivaan Group develops planned residential communities across Ahmedabad with a focus on practical layouts, timely delivery, and transparent documentation.',
            deliveredCount: '3',
            recentlyDeliveredCount: '3',
            ongoingCount: '5',
        },
    },
    {
        _id: '6a170002bbb7f0be8ce9144c',
        title: 'Racer Business Hub Offices on SG Highway, Ahmedabad',
        propertyName: 'Racer Business Hub',
        propertyCategory: 'Commercial',
        propertyType: 'Ready Office',
        listingType: 'Sale',
        city: 'Ahmedabad',
        city_area: 'SG Highway',
        state: 'Gujarat',
        locality: 'SG Highway',
        address: 'Racer Business Hub, SG Highway, Ahmedabad, Gujarat',
        price: 9200000,
        priceUnit: 'total',
        area: 980,
        carpetArea: 720,
        bedrooms: 0,
        bathrooms: 2,
        balcony: 0,
        furnished: 'No',
        floor: 8,
        totalFloors: 16,
        facing: 'North',
        propertyAge: 'New Construction',
        possession: 'Mar, 2027',
        imageFileName: 'Ready_Offices.jpeg',
        coverImage: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ready_Offices.jpeg',
        description:
            'Racer Business Hub is a builder-posted commercial project on SG Highway with office units, strong frontage, lift access, and modern business infrastructure.',
        availableUnits: [
            {
                bhk: 'Office Space',
                bookingType: 'New Bookings',
                brokerage: 'Zero Brokerage',
                sizeRange: '720 - 980 sqft (67 - 91 sqm)',
                areaType: 'Carpet Area',
                price: 'Rs 92 Lac onwards',
                priceSqft: 'Rs 9,388 /sqft',
                optionsCount: 12,
                updatedText: 'Updated 3 weeks ago',
                paymentPlan: 'Milestone-linked Plan',
                paymentPlanSubtitle: 'Payment Plans & banks',
            },
            {
                bhk: 'Retail Office Suite',
                bookingType: 'New Bookings',
                brokerage: 'Zero Brokerage',
                sizeRange: '1100 - 1450 sqft (102 - 135 sqm)',
                areaType: 'Super Built-up Area',
                price: 'Rs 1.45 Cr onwards',
                priceSqft: 'Rs 10,000 /sqft',
                optionsCount: 5,
                updatedText: 'Updated 1 mo. ago',
                paymentPlan: 'Milestone-linked Plan',
                paymentPlanSubtitle: 'Payment Plans & banks',
            },
        ],
        developer: {
            name: 'Racer Buildcon',
            logo: '1779867566748-scaled_71490.jpg',
            experience: '9',
            totalProjects: '5',
            cities: '1',
            description:
                'Racer Buildcon builds commercial and mixed-use projects in Ahmedabad with emphasis on accessibility, services, and business-ready spaces.',
            deliveredCount: '2',
            recentlyDeliveredCount: '1',
            ongoingCount: '3',
        },
    },
];

function toObjectId(id) {
    return new mongoose.Types.ObjectId(id);
}

function buildBuilderProperty(item, index) {
    const createdAt = new Date('2026-05-27T08:00:00Z');
    createdAt.setUTCMinutes(createdAt.getUTCMinutes() + index);

    const isCommercial = item.propertyCategory === 'Commercial';

    return {
        _id: toObjectId(item._id),
        ownerId: toObjectId(BUILDER_ID),
        dealerId: null,

        title: item.title,
        propertyName: item.propertyName,
        propertyCategory: item.propertyCategory,
        propertyType: item.propertyType,
        listingType: item.listingType,
        city: item.city,
        city_area: item.city_area,
        state: item.state,
        locality: item.locality,
        address: item.address,
        price: item.price,
        priceUnit: item.priceUnit,
        area: item.area,
        measureType: 'sqft',
        carpetArea: item.carpetArea,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        balcony: item.balcony,
        furnished: item.furnished,
        parking: true,
        lift: true,
        floor: item.floor,
        totalFloors: item.totalFloors,
        facing: item.facing,
        propertyAge: item.propertyAge,
        availableFor: 'Anyone',
        agreementMonths: 0,
        deposit: Math.round(item.price * 0.05),
        maintenance: isCommercial ? 8500 : 3200,
        possession: item.possession,
        description: item.description,

        amenityIds: amenityIds.map(toObjectId),
        furnishings: furnishingIds.slice(0, isCommercial ? 2 : 4).map((id, furnishingIndex) => ({
            furnishingId: toObjectId(id),
            quantity: furnishingIndex + 1,
        })),
        nearbyPlaces: nearbyPlaceIds.slice(index, index + 3).map((id, nearbyIndex) => ({
            nearbyId: toObjectId(id),
            distance: Number((1.4 + nearbyIndex * 0.8).toFixed(1)),
            distanceUnit: 'km',
        })),

        media: [
            { fileName: item.imageFileName, type: 'image', uploadedAt: createdAt },
            { fileName: `${item._id}.mp4`, type: 'video', uploadedAt: createdAt },
        ],
        coverImage: item.coverImage,

        ownership: 'Freehold',
        flooring: isCommercial ? 'Premium vitrified tiles and concrete core' : 'Vitrified Tiles',
        waterSource: 'Municipal Corporation, Borewell',
        otherKeyFacilities: 'Power Backup, CCTV Surveillance, Fire Safety, Visitor Parking',
        status: 'Active',
        createdAt,
        updatedAt: new Date('2026-05-27T08:30:00Z'),
        deletedAt: null,

        nearbyLandmarks: [
            {
                category: 'Educational Institute',
                icon: 'school_outlined',
                places: [
                    { name: 'Ahmedabad International School', distance: '3.8 Km' },
                    { name: 'Nirma University', distance: '5.4 Km' },
                ],
            },
            {
                category: 'Hospital',
                icon: 'local_hospital_outlined',
                places: [
                    { name: 'Zydus Hospitals', distance: '4.2 Km' },
                    { name: 'Apollo Clinic', distance: '2.6 Km' },
                ],
            },
            {
                category: 'Transit',
                icon: 'directions_bus_outlined',
                places: [
                    { name: 'SG Highway BRTS', distance: '1.1 Km' },
                    { name: 'Sardar Patel Ring Road', distance: '3.0 Km' },
                ],
            },
        ],
        locationCoordinates: {
            latitude: index === 0 ? 23.1035 : 23.0748,
            longitude: index === 0 ? 72.5366 : 72.5094,
        },
        keyHighlights: {
            propertyFeatures: isCommercial
                ? ['High Street Visibility', 'Power Backup', 'Fire Safety', 'Ample Parking']
                : ['Zero Brokerage', 'Power Backup', 'Security', 'Club House'],
            projectHighlights: isCommercial
                ? ['Business-ready Offices', 'Prime SG Highway', 'High-speed Lifts', 'Flexible Units']
                : ['Builder Posted', 'RERA Registered', 'Modern Amenities', 'Construction-linked Payment'],
        },
        floorPlans: item.availableUnits.map((unit) => ({
            bhk: unit.bhk,
            superArea: unit.sizeRange,
            price: unit.price,
            estimatedEmi: isCommercial ? 'Rs 76,000/month' : 'Rs 48,500/month',
            possessionDate: item.possession,
            imageUrl: item.coverImage,
        })),
        legalCertificates: [
            {
                name: 'RERA Registration',
                isAvailable: true,
                documentUrl: 'https://example.com/docs/rera-registration.pdf',
                previewImageUrl: item.coverImage,
                lastUpdated: '2026-05-01',
            },
            {
                name: 'Layout Plan',
                isAvailable: true,
                documentUrl: 'https://example.com/docs/layout-plan.pdf',
                previewImageUrl: item.coverImage,
                lastUpdated: '2026-04-18',
            },
            {
                name: 'Fire NOC',
                isAvailable: isCommercial,
                documentUrl: isCommercial ? 'https://example.com/docs/fire-noc.pdf' : null,
                previewImageUrl: isCommercial ? item.coverImage : null,
                lastUpdated: isCommercial ? '2026-04-10' : null,
            },
        ],
        propWorthInsights: {
            currentLocality: item.locality,
            localityTrend: [6200, 6450, 6700, 7100, 7350, 7600],
            projectTrend: [6500, 6800, 7150, 7500, 7900, 8250],
            timeframe: '1Y',
        },
        aiSummary: `${item.propertyName} is a builder-posted ${item.propertyCategory.toLowerCase()} project by ${item.developer.name}, offering transparent unit availability, payment plans, and verified project information.`,
        reviewTopics: ['Builder Posted', 'Zero Brokerage', 'Good Connectivity', 'Transparent Payment Plan'],
        preLeasedDetails: isCommercial
            ? { leaseAmount: 'Rs 4.8 L/month', leaseTenure: '5 years' }
            : { leaseAmount: '', leaseTenure: '' },
        approvedIndustryTypes: isCommercial ? ['IT/ITES', 'Banking & Finance', 'Consulting', 'Retail'] : [],
        keySpecifications: [
            { label: 'Structure', value: 'RCC frame earthquake resistant' },
            { label: 'Lifts', value: 'High-speed passenger lifts' },
            { label: 'Security', value: 'CCTV surveillance and gated access' },
            { label: 'Power', value: 'Power backup for common areas' },
        ],
        projectDetails: {
            projectName: item.propertyName,
            landZone: isCommercial ? 'Commercial' : 'Residential',
            reraNumber: `PR/GJ/AHMEDABAD/AHMEDABAD/${item._id.toUpperCase()}`,
            passengerLifts: '2 High-Speed Lifts per Block',
            serviceLifts: isCommercial ? '1 Service Lift' : 'Available',
            occupancyCertificate: 'Applied',
            fireNoc: isCommercial ? 'Obtained' : 'Applicable as per norms',
        },
        aboutProject: {
            name: item.propertyName,
            priceRange: item.availableUnits.map((unit) => unit.price).join(' | '),
            totalUnits: isCommercial ? 156 : 240,
        },
        aboutLocality: {
            name: item.locality,
            pincode: '380060',
            rating: 4.3,
            totalReviews: 42,
        },
        aboutDeveloper: {
            name: item.developer.name,
            experienceYears: Number(item.developer.experience),
            officeAddress: 'Ahmedabad, Gujarat',
        },
        topAgents: [
            {
                name: 'racer',
                agency: item.developer.name,
                experience: `Operating for ${item.developer.experience} years`,
                buyersServed: 210,
                propertiesForSale: Number(item.developer.ongoingCount),
                propertiesForRent: 0,
                avatarUrl: 'https://ik.imagekit.io/aj6cyp5nm/users/profile-images/1779867566748-scaled_71490.jpg',
            },
        ],
        specifications: [
            'RCC frame earthquake resistant structure',
            'High-speed lift access',
            'CCTV surveillance in common areas',
            'Dedicated parking and visitor parking',
        ],
        whyConsider: [
            'Posted directly by verified builder',
            'Zero brokerage inventory',
            'Multiple unit options with payment plans',
            'Strong connectivity to SG Highway and city corridors',
        ],
        preels: [
            {
                imageUrl: item.coverImage,
                title: `${item.propertyName} Project Walkthrough`,
                location: `${item.locality}, ${item.city}`,
                views: 3200 + index * 900,
                videoUrl: `https://example.com/reels/${item._id}.mp4`,
            },
        ],
        expertReviews: [
            {
                videoThumbnail: item.coverImage,
                videoUrl: `https://example.com/expert-reviews/${item._id}.mp4`,
                reviewerName: 'Ahmedabad Property Desk',
                channelName: 'Builder Project Review',
                subscribers: 18600,
                views: 64000 + index * 12000,
            },
        ],
        projectInfo: {
            priceRange: {
                min: Math.round(item.price * 0.9),
                max: Math.round(item.price * 1.35),
            },
            totalUnits: isCommercial ? 156 : 240,
        },
        localityInfo: {
            name: item.locality,
            city: item.city,
            pincode: '380060',
            rating: 4.3,
            reviewCount: 42,
        },
        developerInfo: {
            name: item.developer.name,
            yearsExperience: Number(item.developer.experience),
            address: 'Ahmedabad, Gujarat',
        },
        viewStats: {
            viewCount: 180 + index * 65,
            daysPeriod: 30,
        },

        availableUnits: item.availableUnits,
        developer: item.developer,
    };
}

async function seedBuilderProperties() {
    try {
        await mongoose.connect(MONGO_URI, process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {});

        const properties = builderProperties.map(buildBuilderProperty);
        const result = await Property.bulkWrite(
            properties.map((property) => ({
                updateOne: {
                    filter: { _id: property._id },
                    update: { $set: property },
                    upsert: true,
                },
            })),
        );

        console.log(`${result.matchedCount} builder properties matched`);
        console.log(`${result.modifiedCount} builder properties updated`);
        console.log(`${result.upsertedCount} builder properties created`);
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    seedBuilderProperties();
}

module.exports = {
    BUILDER_ID,
    buildBuilderProperty,
    builderProperties,
    seedBuilderProperties,
};

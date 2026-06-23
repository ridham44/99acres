require('dotenv').config();

const mongoose = require('mongoose');
const Property = require('../models/property.model');

const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority';

const OWNER_ID = '6a154cbc03506703b7b95781';

const amenityIds = [
    '6a0ea443e194ff9a92e4243b',
    '6a0ea434e194ff9a92e42433',
    '6a0ea420e194ff9a92e42427',
    '6a0ea410e194ff9a92e4241f',
    '6a0ea42ce194ff9a92e4242f',
    '6a0ea3f8e194ff9a92e42413',
];

const furnishingIds = [
    '6a0ea54ce194ff9a92e42485',
    '6a0ea4a1e194ff9a92e42459',
    '6a0ea491e194ff9a92e42455',
    '6a0ea4ffe194ff9a92e4245d',
    '6a0ea505e194ff9a92e42461',
    '6a0ea543e194ff9a92e42481',
];

const propertyImages = [
    {
        id: '6a155df8907a122bdca28be5',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/house.jpg',
        propertyType: 'House',
        propertyCategory: 'Residential',
        propertyName: 'Shantivan House',
        locality: 'Bopal',
        cityArea: 'Bopal',
        listingType: 'Sale',
        bedrooms: 4,
        bathrooms: 4,
        balcony: 2,
        price: 24500000,
        area: 2850,
        carpetArea: 2350,
    },
    {
        id: '6a155df8907a122bdca28bde',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Manufacturing.jpg',
        propertyType: 'Manufacturing Unit',
        propertyCategory: 'Commercial',
        propertyName: 'Changodar Industrial Unit',
        locality: 'Changodar',
        cityArea: 'SG Highway',
        listingType: 'Sale',
        bedrooms: 0,
        bathrooms: 3,
        balcony: 0,
        price: 36500000,
        area: 9200,
        carpetArea: 8400,
    },
    {
        id: '6a155df8907a122bdca28bd7',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Factory.jpeg',
        propertyType: 'Factory',
        propertyCategory: 'Commercial',
        propertyName: 'Sanand Factory Space',
        locality: 'Sanand',
        cityArea: 'SG Highway',
        listingType: 'Rent',
        bedrooms: 0,
        bathrooms: 4,
        balcony: 0,
        price: 280000,
        area: 12000,
        carpetArea: 10800,
    },
    {
        id: '6a155df8907a122bdca28bd0',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Studio.jpeg',
        propertyType: 'Studio Apartment',
        propertyCategory: 'Residential',
        propertyName: 'Navrang Studio Living',
        locality: 'Navrangpura',
        cityArea: 'Navrangpura',
        listingType: 'Rent',
        bedrooms: 1,
        bathrooms: 1,
        balcony: 1,
        price: 22000,
        area: 580,
        carpetArea: 430,
    },
    {
        id: '6a155df8907a122bdca28bca',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/villa.jpeg',
        propertyType: 'Villa',
        propertyCategory: 'Residential',
        propertyName: 'Skyline Garden Villa',
        locality: 'Thaltej',
        cityArea: 'Thaltej',
        listingType: 'Sale',
        bedrooms: 5,
        bathrooms: 5,
        balcony: 3,
        price: 52000000,
        area: 4200,
        carpetArea: 3600,
    },
    {
        id: '6a155df8907a122bdca28bc3',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Cold_Storage.jpeg',
        propertyType: 'Cold Storage',
        propertyCategory: 'Commercial',
        propertyName: 'Naroda Cold Chain Hub',
        locality: 'Naroda',
        cityArea: 'Naroda',
        listingType: 'Rent',
        bedrooms: 0,
        bathrooms: 2,
        balcony: 0,
        price: 165000,
        area: 7800,
        carpetArea: 7000,
    },
    {
        id: '6a155df8907a122bdca28bb9',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Shops&Retai.jpeg',
        propertyType: 'Shop & Retail',
        propertyCategory: 'Commercial',
        propertyName: 'Prahlad Retail Front',
        locality: 'Prahlad Nagar',
        cityArea: 'Prahlad Nagar',
        listingType: 'Rent',
        bedrooms: 0,
        bathrooms: 1,
        balcony: 0,
        price: 95000,
        area: 1250,
        carpetArea: 1020,
    },
    {
        id: '6a155df8907a122bdca28bb0',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Bare_Shell.jpeg',
        propertyType: 'Bare Shell Office',
        propertyCategory: 'Commercial',
        propertyName: 'Gota Corporate Shell',
        locality: 'Gota',
        cityArea: 'SG Highway',
        listingType: 'Sale',
        bedrooms: 0,
        bathrooms: 2,
        balcony: 0,
        price: 14800000,
        area: 2400,
        carpetArea: 2050,
    },
    {
        id: '6a155df8907a122bdca28ba7',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ware_House.jpeg',
        propertyType: 'Warehouse',
        propertyCategory: 'Commercial',
        propertyName: 'Aslali Logistics Warehouse',
        locality: 'Aslali',
        cityArea: 'Narol',
        listingType: 'Rent',
        bedrooms: 0,
        bathrooms: 3,
        balcony: 0,
        price: 210000,
        area: 15000,
        carpetArea: 13800,
    },
    {
        id: '6a155df8907a122bdca28b9e',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ready_Offices.jpeg',
        propertyType: 'Ready Office',
        propertyCategory: 'Commercial',
        propertyName: 'Satellite Ready Office',
        locality: 'Satellite',
        cityArea: 'Satellite',
        listingType: 'Sale',
        bedrooms: 0,
        bathrooms: 2,
        balcony: 0,
        price: 13200000,
        area: 1850,
        carpetArea: 1520,
    },
    {
        id: '6a155df8907a122bdca28b97',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/farm_house.jpeg',
        propertyType: 'Farm House',
        propertyCategory: 'Residential',
        propertyName: 'Sanand Green Farm House',
        locality: 'Sanand',
        cityArea: 'SG Highway',
        listingType: 'Sale',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        price: 31000000,
        area: 9800,
        carpetArea: 2600,
    },
    {
        id: '6a155df8907a122bdca28b8f',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Builder_Floor.jpeg',
        propertyType: 'Builder Floor',
        propertyCategory: 'Residential',
        propertyName: 'Science City Builder Floor',
        locality: 'Science City',
        cityArea: 'Science City',
        listingType: 'Sale',
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        price: 16800000,
        area: 2050,
        carpetArea: 1720,
    },
    {
        id: '6a155df8907a122bdca28b85',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/service_apartment.jpeg',
        propertyType: 'Service Apartment',
        propertyCategory: 'Residential',
        propertyName: 'SG Service Suites',
        locality: 'SG Highway',
        cityArea: 'SG Highway',
        listingType: 'Rent',
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        price: 52000,
        area: 1180,
        carpetArea: 930,
    },
    {
        id: '6a155df8907a122bdca28b7c',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/plot.jpeg',
        propertyType: 'Plot',
        propertyCategory: 'Residential',
        propertyName: 'Bopal Premium Plot',
        locality: 'Bopal',
        cityArea: 'Bopal',
        listingType: 'Sale',
        bedrooms: 0,
        bathrooms: 0,
        balcony: 0,
        price: 22500000,
        area: 4500,
        carpetArea: 0,
    },
    {
        id: '6a155df8907a122bdca28b75',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/independet_house.jpeg',
        propertyType: 'Independent House',
        propertyCategory: 'Residential',
        propertyName: 'Gota Independent House',
        locality: 'Gota',
        cityArea: 'Gota',
        listingType: 'Sale',
        bedrooms: 4,
        bathrooms: 4,
        balcony: 2,
        price: 29500000,
        area: 3200,
        carpetArea: 2700,
    },
];

const listedProperties = [
    {
        id: '6a155df8907a122bdca28b6e',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Flat for Sale in Thaltej',
        propertyName: 'Thaltej Flat',
        propertyType: 'Flat',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Thaltej',
        state: 'Gujarat',
        locality: 'Thaltej',
        address: '37050 McCullough Shore Apt. 943',
        price: 8984991,
        bedrooms: 5,
        bathrooms: 2,
        balcony: 2,
        area: 6908,
        carpetArea: 5800,
        facing: 'South',
    },
    {
        id: '6a154fe303506703b7b957cc',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: '1 BHK Apartment For Sale in Satellite, Ahmedabad, Gujarat',
        propertyName: 'Cool',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Satellite',
        state: 'Gujarat',
        locality: 'Satellite',
        address: 'Satellite, Ahmedabad, Gujarat',
        price: 2000000,
        bedrooms: 1,
        bathrooms: 1,
        balcony: 1,
        area: 300,
        carpetArea: 250,
        facing: 'East',
    },
    {
        id: '6a153e612b11ec7a0ea6e9aa',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: '2 BHK Apartment For Sale in Bodakdev, Ahmedabad, Gujarat',
        propertyName: 'LIFE STYLE',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Bodakdev',
        state: 'Gujarat',
        locality: 'Bodakdev',
        address: 'Bodakdev, Ahmedabad, Gujarat',
        price: 1500000,
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        area: 300,
        carpetArea: 255,
        facing: 'North',
    },
    {
        id: '6a15333da4bf1e954a2e478c',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/independet_house.jpeg',
        title: '7 BHK House',
        propertyName: 'Albany Family Villa',
        propertyType: 'Independent House',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Albany',
        cityArea: 'WhiteHall',
        state: 'New York',
        locality: 'Pine Hills',
        address: '123 Western Ave, Albany, NY 12203, USA',
        price: 450000,
        bedrooms: 4,
        bathrooms: 3,
        balcony: 2,
        area: 2500,
        carpetArea: 2100,
        facing: 'South',
    },
    {
        id: '6a145f45d0ee0eeab39fc23f',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/house.jpg',
        title: 'Guesthouse in Sargasan',
        propertyName: 'Guesthouse Heights',
        propertyType: 'Bungalow',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Gandhinagar',
        cityArea: 'Sargasan',
        state: 'Gujarat',
        locality: 'Sargasan',
        address: 'Sargasan, Gandhinagar, Gujarat',
        price: 32000000,
        bedrooms: 8,
        bathrooms: 8,
        balcony: 4,
        area: 5000,
        carpetArea: 4300,
        facing: 'North',
    },
    {
        id: '6a145f45d0ee0eeab39fc23b',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ready_Offices.jpeg',
        title: 'Office Space in Infocity',
        propertyName: 'Office Heights',
        propertyType: 'Office',
        propertyCategory: 'Commercial',
        listingType: 'Sale',
        city: 'Gandhinagar',
        cityArea: 'Sector 0',
        state: 'Gujarat',
        locality: 'Infocity',
        address: 'Infocity, Gandhinagar, Gujarat',
        price: 8500000,
        bedrooms: 0,
        bathrooms: 1,
        balcony: 0,
        area: 800,
        carpetArea: 650,
        facing: 'West',
    },
    {
        id: '6a145f45d0ee0eeab39fc233',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/villa.jpeg',
        title: 'Luxurious Bungalow in GIFT City',
        propertyName: 'Luxurious Heights',
        propertyType: 'Villa',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Gandhinagar',
        cityArea: 'GIFT City',
        state: 'Gujarat',
        locality: 'GIFT City',
        address: 'GIFT City, Gandhinagar, Gujarat',
        price: 45000000,
        bedrooms: 5,
        bathrooms: 5,
        balcony: 3,
        area: 4200,
        carpetArea: 3600,
        facing: 'East',
    },
    {
        id: '6a145f45d0ee0eeab39fc237',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Affordable 2 BHK in Kudasan',
        propertyName: 'Affordable Heights',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Gandhinagar',
        cityArea: 'Kudasan',
        state: 'Gujarat',
        locality: 'Kudasan',
        address: 'Kudasan, Gandhinagar, Gujarat',
        price: 4800000,
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        area: 1100,
        carpetArea: 910,
        facing: 'South',
    },
    {
        id: '6a145f45d0ee0eeab39fc22f',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Quiet 3 BHK in Sector 21',
        propertyName: 'Quiet Heights',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Gandhinagar',
        cityArea: 'Sector 21',
        state: 'Gujarat',
        locality: 'Sector 21',
        address: 'Sector 21, Gandhinagar, Gujarat',
        price: 7500000,
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        area: 1600,
        carpetArea: 1320,
        facing: 'North',
    },
    {
        id: '6a145f45d0ee0eeab39fc22b',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Executive PG in SG Highway',
        propertyName: 'Executive Heights',
        propertyType: 'Apartment',
        propertyCategory: 'PG',
        listingType: 'Rent',
        city: 'Ahmedabad',
        cityArea: 'Gota',
        state: 'Gujarat',
        locality: 'SG Highway',
        address: 'SG Highway, Ahmedabad, Gujarat',
        price: 12000,
        bedrooms: 3,
        bathrooms: 3,
        balcony: 1,
        area: 1500,
        carpetArea: 1260,
        facing: 'East',
    },
    {
        id: '6a145f45d0ee0eeab39fc227',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Shops&Retai.jpeg',
        title: 'Commercial Shop in Vastrapur',
        propertyName: 'Commercial Heights',
        propertyType: 'Shop',
        propertyCategory: 'Commercial',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Vastrapur',
        state: 'Gujarat',
        locality: 'Vastrapur',
        address: 'Vastrapur, Ahmedabad, Gujarat',
        price: 15000000,
        bedrooms: 0,
        bathrooms: 0,
        balcony: 0,
        area: 600,
        carpetArea: 520,
        facing: 'South',
    },
    {
        id: '6a145f45d0ee0eeab39fc223',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: '2 BHK Near Prahlad Nagar Garden',
        propertyName: '2 Heights',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Satellite',
        state: 'Gujarat',
        locality: 'Prahlad Nagar',
        address: 'Prahlad Nagar, Ahmedabad, Gujarat',
        price: 6500000,
        bedrooms: 2,
        bathrooms: 2,
        balcony: 1,
        area: 1250,
        carpetArea: 1030,
        facing: 'West',
    },
    {
        id: '6a145f45d0ee0eeab39fc21f',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/villa.jpeg',
        title: 'Elegant Villa in Bopal',
        propertyName: 'Elegant Heights',
        propertyType: 'Villa',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Bopal',
        state: 'Gujarat',
        locality: 'Bopal',
        address: 'Bopal, Ahmedabad, Gujarat',
        price: 25000000,
        bedrooms: 4,
        bathrooms: 4,
        balcony: 2,
        area: 3500,
        carpetArea: 2950,
        facing: 'North',
    },
    {
        id: '6a145f45d0ee0eeab39fc21b',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Modern 3 BHK Flat in Satellite',
        propertyName: 'Modern Heights',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Ahmedabad',
        cityArea: 'Satellite',
        state: 'Gujarat',
        locality: 'Satellite',
        address: 'Satellite, Ahmedabad, Gujarat',
        price: 9500000,
        bedrooms: 3,
        bathrooms: 3,
        balcony: 2,
        area: 1850,
        carpetArea: 1540,
        facing: 'East',
    },
    {
        id: '6a145f45d0ee0eeab39fc217',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'High-End PG for Girls in Juhu',
        propertyName: 'High-End Heights',
        propertyType: 'Flat',
        propertyCategory: 'PG',
        listingType: 'Rent',
        city: 'Mumbai',
        cityArea: 'Vile Parle',
        state: 'Maharashtra',
        locality: 'Juhu',
        address: 'Juhu, Mumbai, Maharashtra',
        price: 45000,
        bedrooms: 4,
        bathrooms: 4,
        balcony: 2,
        area: 1200,
        carpetArea: 960,
        facing: 'West',
    },
    {
        id: '6a145f45d0ee0eeab39fc213',
        image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/flat.jpeg',
        title: 'Studio Apartment in Andheri East',
        propertyName: 'Studio Heights',
        propertyType: 'Apartment',
        propertyCategory: 'Residential',
        listingType: 'Sale',
        city: 'Mumbai',
        cityArea: 'Andheri',
        state: 'Maharashtra',
        locality: 'Andheri East',
        address: 'Andheri East, Mumbai, Maharashtra',
        price: 11000000,
        bedrooms: 1,
        bathrooms: 1,
        balcony: 1,
        area: 350,
        carpetArea: 300,
        facing: 'East',
    },
];

const allProperties = [...listedProperties, ...propertyImages];

function toObjectId(id) {
    return new mongoose.Types.ObjectId(id);
}

function getImageFileName(imageUrl) {
    return imageUrl.split('/').pop();
}

function pickFromIndex(items, index, count) {
    return items.slice(index % items.length).concat(items).slice(0, count);
}

function getTitle(item) {
    if (item.title) {
        return item.title;
    }

    const action = item.listingType === 'Sale' ? 'for Sale' : 'for Rent';
    return `${item.bedrooms || ''} ${item.propertyType} ${action} in ${item.locality}, ${item.city || 'Ahmedabad'}`
        .replace(/\s+/g, ' ')
        .trim();
}

function buildProperty(item, index) {
    const isResidential = item.propertyCategory === 'Residential';
    const isSale = item.listingType === 'Sale';
    const createdAt = new Date('2026-01-10T00:00:00Z');
    createdAt.setUTCDate(createdAt.getUTCDate() + index);
    const updatedAt = new Date('2026-05-01T00:00:00Z');
    const projectName = item.propertyName;
    const imageFileName = getImageFileName(item.image);
    const city = item.city || 'Ahmedabad';
    const state = item.state || 'Gujarat';
    const facing = item.facing || ['East', 'North', 'West', 'South'][index % 4];

    return {
        _id: toObjectId(item.id),
        ownerId: toObjectId(OWNER_ID),
        dealerId: toObjectId(OWNER_ID),

        title: getTitle(item),
        propertyName: projectName,
        propertyCategory: item.propertyCategory,
        propertyType: item.propertyType,
        listingType: item.listingType,

        city,
        city_area: item.cityArea,
        state,
        locality: item.locality,
        address: item.address || `${projectName}, ${item.locality}, ${city}, ${state}`,

        price: item.price,
        priceUnit: isSale ? 'total' : 'monthly',

        area: item.area,
        measureType: 'sqft',
        carpetArea: item.carpetArea,

        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        balcony: item.balcony,

        furnished: isResidential ? ['Semi', 'Yes', 'No'][index % 3] : 'No',
        parking: true,
        lift: item.propertyType.includes('Plot') || item.propertyType.includes('Farm') ? false : true,

        floor: isResidential && !item.propertyType.includes('House') && !item.propertyType.includes('Villa') ? (index % 9) + 1 : 0,
        totalFloors: isResidential && !item.propertyType.includes('House') && !item.propertyType.includes('Villa') ? 14 : 1,

        facing,
        propertyAge: ['0-1 Years', '1-5 Years', '5-10 Years'][index % 3],
        availableFor: isResidential ? ['Family', 'Anyone', 'Bachelors'][index % 3] : 'Anyone',

        agreementMonths: isSale ? 0 : 11,
        deposit: isSale ? Math.round(item.price * 0.03) : item.price * 3,
        maintenance: isResidential ? 3500 + index * 250 : 7000 + index * 500,
        possession: isSale ? 'Ready to Move' : 'Immediate',

        description: `${projectName} is a ${item.propertyCategory.toLowerCase()} ${item.propertyType.toLowerCase()} in ${item.locality}, Ahmedabad with strong connectivity, practical layouts, and verified property information for test data.`,

        amenityIds: pickFromIndex(amenityIds, index, 4).map(toObjectId),
        furnishings: pickFromIndex(furnishingIds, index, isResidential ? 4 : 2).map((id, furnishingIndex) => ({
            furnishingId: toObjectId(id),
            quantity: furnishingIndex + 1,
        })),
        media: [
            { type: 'image', fileName: imageFileName, uploadedAt: createdAt },
            { type: 'video', fileName: `${item.id}.mp4`, uploadedAt: updatedAt },
        ],
        coverImage: item.image,

        ownership: isSale ? 'Freehold' : 'Leasehold',
        flooring: isResidential ? 'Vitrified Tiles' : 'Concrete / Vitrified Tiles',
        waterSource: 'Municipal Corporation, Borewell',
        otherKeyFacilities: 'Power Backup, CCTV Surveillance, Security, Internet Connectivity',

        status: 'Active',
        createdAt,
        updatedAt,
        deletedAt: null,

        nearbyLandmarks: [
            { name: `${item.locality} Public School`, distance: '2.1 Km' },
            { name: 'Ahmedabad International School', distance: '4.4 Km' },
            { name: `${item.locality} Multispeciality Hospital`, distance: '1.8 Km' },
            { name: 'Zydus Hospitals', distance: '5.0 Km' },
            { name: `${item.locality} Market`, distance: '1.0 Km' },
        ],

        locationCoordinates: {
            latitude: Number((23.0225 + index * 0.006).toFixed(6)),
            longitude: Number((72.5714 - index * 0.004).toFixed(6)),
        },

        keyHighlights: {
            propertyFeatures: isResidential
                ? ['Power Backup', 'Visitor Parking', 'Security', 'Firefighting System']
                : ['Wide Road Access', 'Power Backup', 'Security', 'Loading Area'],
            projectHighlights: isResidential
                ? ['Club House', 'Landscaped Garden', 'Modern Design', 'Reserved Parking']
                : ['Prime Business Location', 'High Visibility', 'Easy Transport Access', 'Flexible Layout'],
        },

        floorPlans: [
            {
                bhk: isResidential ? `${Math.max(item.bedrooms, 1)} BHK` : item.propertyType,
                superArea: `${item.area} sq.ft.`,
                price: isSale ? `Rs ${item.price.toLocaleString('en-IN')}` : `Rs ${item.price.toLocaleString('en-IN')}/month`,
                estimatedEmi: isSale ? `Rs ${Math.round(item.price / 120).toLocaleString('en-IN')}/month` : '',
                possessionDate: item.possession || 'Ready to Move',
                imageUrl: item.image,
            },
        ],

        legalCertificates: [
            {
                name: 'Title Clearance',
                isAvailable: true,
                documentUrl: 'https://example.com/docs/title-clearance.pdf',
                previewImageUrl: item.image,
                lastUpdated: '2025-09-09',
            },
            {
                name: 'Floor Plan',
                isAvailable: true,
                documentUrl: 'https://example.com/docs/floor-plan.pdf',
                previewImageUrl: item.image,
                lastUpdated: '2025-08-15',
            },
            {
                name: 'Fire NOC',
                isAvailable: item.propertyCategory === 'Commercial',
                documentUrl: item.propertyCategory === 'Commercial' ? 'https://example.com/docs/fire-noc.pdf' : null,
                previewImageUrl: item.propertyCategory === 'Commercial' ? item.image : null,
                lastUpdated: item.propertyCategory === 'Commercial' ? '2025-06-20' : null,
            },
        ],

        propWorthInsights: {
            currentLocality: item.locality,
            localityTrend: [5200, 5550, 5820, 6100, 6450, 6800].map((value) => value + index * 75),
            projectTrend: [5600, 5950, 6300, 6700, 7150, 7600].map((value) => value + index * 80),
            timeframe: '1Y',
        },

        aiSummary: `${projectName} in ${item.locality} is a strong ${item.listingType.toLowerCase()} option with useful amenities, clean documentation, and good access to major city corridors.`,

        reviewTopics: ['Great Connectivity', 'Clean Documentation', 'Useful Amenities', 'Good Location'],

        preLeasedDetails: {
            leaseAmount: item.propertyCategory === 'Commercial' ? `Rs ${Math.round(item.price * 0.9).toLocaleString('en-IN')}/month` : '',
            leaseTenure: item.propertyCategory === 'Commercial' ? '5 years' : '',
        },

        approvedIndustryTypes: item.propertyCategory === 'Commercial'
            ? ['IT/ITES', 'Banking & Finance', 'Healthcare', 'Retail']
            : [],

        keySpecifications: [
            { label: 'Structure', value: 'RCC frame earthquake resistant' },
            { label: 'Flooring', value: isResidential ? 'Premium vitrified tiles' : 'Heavy duty industrial flooring' },
            { label: 'Security', value: 'CCTV surveillance and gated access' },
            { label: 'Water', value: 'Municipal and borewell supply' },
        ],

        projectDetails: {
            projectName,
            landZone: item.propertyCategory === 'Commercial' ? 'Commercial' : 'Residential',
            reraNumber: `PR/GJ/AHMEDABAD/${item.id.toUpperCase()}`,
            passengerLifts: item.propertyType.includes('Plot') || item.propertyType.includes('House') ? 'Not Applicable' : '2 Lifts',
            serviceLifts: item.propertyCategory === 'Commercial' ? '1 Service Lift' : 'Available',
            occupancyCertificate: 'Available',
            fireNoc: item.propertyCategory === 'Commercial' ? 'Obtained' : 'Applicable as per project',
        },

        aboutProject: {
            name: projectName,
            priceRange: isSale ? `Rs ${item.price.toLocaleString('en-IN')}` : `Rs ${item.price.toLocaleString('en-IN')}/month`,
            totalUnits: 120 + index * 8,
        },

        aboutLocality: {
            name: item.locality,
            pincode: '380015',
            rating: Number((4.0 + (index % 5) * 0.1).toFixed(1)),
            totalReviews: 30 + index * 3,
        },

        aboutDeveloper: {
            name: 'WebEarl Realty Developers',
            experienceYears: 18 + (index % 8),
            officeAddress: '601, Titanium City Centre, Anandnagar Road, Satellite, Ahmedabad - 380015',
        },

        topAgents: [
            {
                name: 'Mahendra Prajapati',
                agency: 'Plinth Realty',
                experience: 'Operating since 2023',
                buyersServed: 85 + index,
                propertiesForSale: 12,
                propertiesForRent: 5,
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            },
            {
                name: 'Riya Shah',
                agency: 'HomeFirst Realtors',
                experience: 'Operating since 2019',
                buyersServed: 142 + index,
                propertiesForSale: 20,
                propertiesForRent: 8,
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
            },
        ],

        specifications: [
            'RCC frame earthquake resistant structure',
            isResidential ? 'Premium vitrified flooring in living and bedrooms' : 'High load bearing flooring',
            'Concealed wiring with MCB circuit breaker panel',
            'CCTV surveillance and controlled entry',
        ],

        whyConsider: [
            `Prime ${item.locality} location`,
            item.propertyCategory === 'Commercial' ? 'Suitable for business operations' : 'Well planned residential layout',
            'Verified media and seed data',
            'Strong road connectivity across Ahmedabad',
        ],

        preels: [
            {
                imageUrl: item.image,
                title: `${projectName} Walkthrough`,
                location: `${item.locality}, Ahmedabad`,
                views: 1000 + index * 221,
                videoUrl: `https://example.com/reels/${item.id}.mp4`,
            },
        ],

        expertReviews: [
            {
                videoThumbnail: item.image,
                videoUrl: `https://example.com/expert-reviews/${item.id}.mp4`,
                reviewerName: 'Kalpesh Mehta',
                channelName: 'Ahmedabad Property Guide',
                subscribers: 12400,
                views: 50100 + index * 900,
            },
        ],

        projectInfo: {
            priceRange: {
                min: isSale ? Math.round(item.price * 0.9) : item.price,
                max: isSale ? Math.round(item.price * 1.1) : item.price * 2,
            },
            totalUnits: 120 + index * 8,
        },

        localityInfo: {
            name: item.locality,
            city: 'Ahmedabad',
            pincode: '380015',
            rating: Number((4.0 + (index % 5) * 0.1).toFixed(1)),
            reviewCount: 30 + index * 3,
        },

        developerInfo: {
            name: 'WebEarl Realty Developers',
            yearsExperience: 18 + (index % 8),
            address: '601, Titanium City Centre, Anandnagar Road, Satellite, Ahmedabad - 380015',
        },

        viewStats: {
            viewCount: 67 + index * 13,
            daysPeriod: 30,
        },
    };
}

async function seedProperties() {
    try {
        await mongoose.connect(MONGO_URI, process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {});

        const properties = allProperties.map(buildProperty);

        const result = await Property.bulkWrite(
            properties.map((property) => ({
                updateOne: {
                    filter: { _id: property._id },
                    update: { $set: property },
                    upsert: true,
                },
            })),
        );

        console.log(`${result.matchedCount} properties matched`);
        console.log(`${result.modifiedCount} properties updated`);
        console.log(`${result.upsertedCount} properties created`);
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    seedProperties();
}

module.exports = {
    allProperties,
    buildProperty,
    listedProperties,
    propertyImages,
    seedProperties,
};

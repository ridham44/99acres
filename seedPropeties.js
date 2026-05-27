const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

mongoose.connect(
    'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority',
);

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

        title: String,
        propertyName: String,
        propertyCategory: String,
        propertyType: String,
        listingType: String,
        city: String,
        city_area: String,
        state: String,
        locality: String,
        address: String,
        price: Number,
        priceUnit: String,
        area: Number,
        measureType: String,
        carpetArea: Number,
        bedrooms: Number,
        bathrooms: Number,
        balcony: Number,
        furnished: String,
        parking: Boolean,
        lift: Boolean,
        floor: Number,
        totalFloors: Number,
        facing: String,
        propertyAge: String,
        availableFor: String,
        agreementMonths: Number,
        deposit: Number,
        maintenance: Number,
        possession: String,
        description: String,

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
                },
                quantity: Number,
            },
        ],

        nearbyPlaces: [
            {
                nearbyId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'NearbyPlace',
                },
                distance: Number,
                distanceUnit: String,
            },
        ],

        media: [String],

        ownership: String,
        flooring: String,
        waterSource: String,
        otherKeyFacilities: String,

        status: String,

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

const Property = mongoose.model('Property', propertySchema);

const ownerId = '6a154cbc03506703b7b95781';

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

const nearbyPlaceIds = [
    '6a0ea5ace194ff9a92e4249f',
    '6a0ea5a2e194ff9a92e4249b',
    '6a0ea599e194ff9a92e42497',
    '6a0ea590e194ff9a92e42493',
    '6a0ea584e194ff9a92e4248f',
];

const cities = [
    {
        city: 'Ahmedabad',
        state: 'Gujarat',
        areas: [
            'SG Highway',
            'Satellite',
            'Bopal',
            'Prahlad Nagar',
            'Gota',
            'Thaltej',
            'Navrangpura',
            'Science City',
        ],
    },
];

const propertyData = [
    {
        propertyType: 'Flat',
        category: 'Residential',
        image: 'flat.jpeg',
    },
    {
        propertyType: 'Independent House',
        category: 'Residential',
        image: 'independet_house.jpeg',
    },
    {
        propertyType: 'Plot',
        category: 'Residential',
        image: 'plot.jpeg',
    },
    {
        propertyType: 'Service Apartment',
        category: 'Residential',
        image: 'service_apartment.jpeg',
    },
    {
        propertyType: 'Builder Floor',
        category: 'Residential',
        image: 'Builder_Floor.jpeg',
    },
    {
        propertyType: 'Farm House',
        category: 'Residential',
        image: 'farm_house.jpeg',
    },
    {
        propertyType: 'Ready Office',
        category: 'Commercial',
        image: 'Ready_Offices.jpeg',
    },
    {
        propertyType: 'Warehouse',
        category: 'Commercial',
        image: 'Ware_House.jpeg',
    },
    {
        propertyType: 'Bare Shell Office',
        category: 'Commercial',
        image: 'Bare_Shell.jpeg',
    },
    {
        propertyType: 'Shop & Retail',
        category: 'Commercial',
        image: 'Shops&Retai.jpeg',
    },
    {
        propertyType: 'Cold Storage',
        category: 'Commercial',
        image: 'Cold_Storage.jpeg',
    },
    {
        propertyType: 'Villa',
        category: 'Residential',
        image: 'villa.jpeg',
    },
    {
        propertyType: 'Studio Apartment',
        category: 'Residential',
        image: 'Studio.jpeg',
    },
    {
        propertyType: 'Factory',
        category: 'Commercial',
        image: 'Factory.jpeg',
    },
    {
        propertyType: 'Manufacturing Unit',
        category: 'Commercial',
        image: 'Manufacturing.jpg',
    },
    {
        propertyType: 'House',
        category: 'Residential',
        image: 'house.jpg',
    },
];

const furnishingTypes = ['No', 'Semi', 'Yes'];

const facingTypes = ['North', 'South', 'East', 'West'];

const availableForTypes = [
    'Family',
    'Bachelors',
    'Anyone',
];

async function seedProperties() {
    try {
        const properties = [];

        for (const item of propertyData) {
            const selectedCity =
                cities[Math.floor(Math.random() * cities.length)];

            const selectedArea =
                selectedCity.areas[
                    Math.floor(Math.random() * selectedCity.areas.length)
                ];

            const listingType =
                Math.random() > 0.5 ? 'Sale' : 'Rent';

            const totalFloors = faker.number.int({
                min: 1,
                max: 25,
            });

            const floor = faker.number.int({
                min: 0,
                max: totalFloors,
            });

            const isResidential =
                item.category === 'Residential';

            properties.push({
                ownerId: new mongoose.Types.ObjectId(ownerId),

                dealerId: new mongoose.Types.ObjectId(ownerId),

                title: `${item.propertyType} for ${listingType} in ${selectedArea}`,

                propertyName: `${selectedArea} ${item.propertyType}`,

                propertyCategory: item.category,

                propertyType: item.propertyType,

                listingType,

                city: selectedCity.city,

                city_area: selectedArea,

                state: selectedCity.state,

                locality: selectedArea,

                address: faker.location.streetAddress(true),

                price:
                    listingType === 'Sale'
                        ? faker.number.int({
                              min: 1500000,
                              max: 50000000,
                          })
                        : faker.number.int({
                              min: 10000,
                              max: 250000,
                          }),

                priceUnit:
                    listingType === 'Sale'
                        ? 'total'
                        : 'monthly',

                area: faker.number.int({
                    min: 500,
                    max: 10000,
                }),

                measureType: 'sqft',

                carpetArea: faker.number.int({
                    min: 400,
                    max: 8000,
                }),

                bedrooms: isResidential
                    ? faker.number.int({
                          min: 1,
                          max: 5,
                      })
                    : 0,

                bathrooms: faker.number.int({
                    min: 1,
                    max: 5,
                }),

                balcony: isResidential
                    ? faker.number.int({
                          min: 0,
                          max: 3,
                      })
                    : 0,

                furnished:
                    furnishingTypes[
                        Math.floor(
                            Math.random() *
                                furnishingTypes.length,
                        )
                    ],

                parking: faker.datatype.boolean(),

                lift: faker.datatype.boolean(),

                floor,

                totalFloors,

                facing:
                    facingTypes[
                        Math.floor(
                            Math.random() *
                                facingTypes.length,
                        )
                    ],

                propertyAge: `${faker.number.int({
                    min: 0,
                    max: 15,
                })} years`,

                availableFor:
                    availableForTypes[
                        Math.floor(
                            Math.random() *
                                availableForTypes.length,
                        )
                    ],

                agreementMonths: faker.number.int({
                    min: 6,
                    max: 24,
                }),

                deposit: faker.number.int({
                    min: 20000,
                    max: 500000,
                }),

                maintenance: faker.number.int({
                    min: 1000,
                    max: 15000,
                }),

                possession: faker.helpers.arrayElement([
                    'Immediate',
                    'Within 1 Month',
                    'Within 3 Months',
                ]),

                description: faker.lorem.paragraph(4),

                amenityIds: faker.helpers.arrayElements(
                    amenityIds,
                    {
                        min: 3,
                        max: 5,
                    },
                ),

                furnishings: faker.helpers
                    .arrayElements(furnishingIds, {
                        min: 2,
                        max: 5,
                    })
                    .map((id) => ({
                        furnishingId: id,
                        quantity: faker.number.int({
                            min: 1,
                            max: 5,
                        }),
                    })),

                nearbyPlaces: faker.helpers
                    .arrayElements(nearbyPlaceIds, {
                        min: 2,
                        max: 4,
                    })
                    .map((id) => ({
                        nearbyId: id,
                        distance: faker.number.float({
                            min: 0.5,
                            max: 8,
                            fractionDigits: 1,
                        }),
                        distanceUnit: 'km',
                    })),

                media: [item.image],

                ownership: faker.helpers.arrayElement([
                    'Freehold',
                    'Leasehold',
                ]),

                flooring: faker.helpers.arrayElement([
                    'Marble',
                    'Vitrified',
                    'Wooden',
                    'Granite',
                ]),

                waterSource: faker.helpers.arrayElement([
                    'Municipal',
                    'Borewell',
                    '24 Hours Water',
                ]),

                otherKeyFacilities:
                    'Power Backup, CCTV, Security, Garden Area',

                status: 'Active',
            });
        }

        await Property.insertMany(properties);

        console.log(
            '16 fake properties inserted successfully',
        );

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedProperties();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

mongoose.connect( 'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority');

const nearbyPlaceSchema = new mongoose.Schema(
    {
        city: String,
        locality: String,
        placeName: String,
        placeType: String,
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

const NearbyPlace = mongoose.model('NearbyPlace', nearbyPlaceSchema);

const nycLocalities = [
    'Manhattan',
    'Brooklyn',
    'Queens',
    'Bronx',
    'Staten Island',
    'Harlem',
    'Chelsea',
    'SoHo',
    'Tribeca',
    'Upper East Side',
    'Upper West Side',
    'Williamsburg',
    'Bushwick',
    'Astoria',
    'Flushing',
];

const placeTypes = ['Restaurant', 'Cafe', 'University', 'Mall', 'Hospital', 'Park', 'Gym', 'Library', 'School', 'Hotel'];

async function seedNearbyPlaces() {
    try {
        const places = [];

        for (let i = 0; i < 25; i++) {
            const placeType = placeTypes[Math.floor(Math.random() * placeTypes.length)];

            places.push({
                city: 'New York City',
                locality: nycLocalities[Math.floor(Math.random() * nycLocalities.length)],
                placeName: faker.company.name(),
                placeType,
            });
        }

        await NearbyPlace.insertMany(places);

        console.log('25 nearby places inserted successfully');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedNearbyPlaces();

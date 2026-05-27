const mongoose = require('mongoose');

const MONGO_URI =
    'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority';

async function updateImages() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log('MongoDB Connected');

        const db = mongoose.connection.db;

        const propertyImages = [
            {
                id: '6a155df8907a122bdca28be5',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/house.jpg',
            },
            {
                id: '6a155df8907a122bdca28bde',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Manufacturing.jpg',
            },
            {
                id: '6a155df8907a122bdca28bd7',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Factory.jpeg',
            },
            {
                id: '6a155df8907a122bdca28bd0',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Studio.jpeg',
            },
            {
                id: '6a155df8907a122bdca28bca',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/villa.jpeg',
            },
            {
                id: '6a155df8907a122bdca28bc3',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Cold_Storage.jpeg',
            },
            {
                id: '6a155df8907a122bdca28bb9',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Shops&Retai.jpeg',
            },
            {
                id: '6a155df8907a122bdca28bb0',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Bare_Shell.jpeg',
            },
            {
                id: '6a155df8907a122bdca28ba7',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ware_House.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b9e',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Ready_Offices.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b97',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/farm_house.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b8f',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/Builder_Floor.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b85',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/service_apartment.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b7c',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/plot.jpeg',
            },
            {
                id: '6a155df8907a122bdca28b75',
                image: 'https://ik.imagekit.io/aj6cyp5nm/properties/images/independet_house.jpeg',
            },
        ];

        for (const item of propertyImages) {
            await db.collection('properties').updateOne(
                {
                    _id: new mongoose.Types.ObjectId(item.id),
                },
                {
                    $set: {
                        coverImage: item.image,
                        media: [item.image],
                    },
                },
            );

            console.log(`Updated ${item.id}`);
        }

        console.log('All images updated successfully');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updateImages();

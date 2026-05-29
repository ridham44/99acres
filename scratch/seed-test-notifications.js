const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables from the local workspace
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/user.model');
const { createAndSendNotification } = require('../utils/socket');

const seedNotifications = async () => {
    try {
        console.log('--- STARTING NOTIFICATION TESTING SEEDER ---');
        console.log('1. Connecting to MongoDB...');
        await connectDB();

        console.log('2. Querying for an active user or admin...');
        let testUser = await User.findOne({ deletedAt: null });

        if (!testUser) {
            console.log('   [WARNING] No user found in database. Creating a temporary test user...');
            testUser = await User.create({
                name: 'Test Notification User',
                phone: '9876543210',
                email: 'notificationtest@example.com',
                role: 'user',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            console.log(`   [SUCCESS] Created test user: ${testUser.name} | ID: ${testUser._id}`);
        } else {
            console.log(`   [SUCCESS] Found existing user: ${testUser.name} | ID: ${testUser._id} | Role: ${testUser.role}`);
        }

        console.log('\n3. Creating Test Notification 1 (Property Document Verification)...');
        const notif1 = await createAndSendNotification({
            recipientId: testUser._id,
            recipientType: 'user',
            title: 'Property Document Approved',
            message: 'Your Floor Plan proof document for "Premium Lakeview Villa" has been successfully verified and approved.',
            type: 'property_approval',
        });
        console.log(`   [SUCCESS] Saved: "${notif1.title}" (ID: ${notif1._id})`);

        console.log('\n4. Creating Test Notification 2 (Inquiry Alert)...');
        const notif2 = await createAndSendNotification({
            recipientId: testUser._id,
            recipientType: 'user',
            title: 'New Property Inquiry Received',
            message: 'A buyer named Rahul Sharma has requested more details regarding your listing "Luxury 3BHK Penthouse".',
            type: 'inquiry',
        });
        console.log(`   [SUCCESS] Saved: "${notif2.title}" (ID: ${notif2._id})`);

        console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
        console.log(`Two test notifications are now stored in the database for user ID: ${testUser._id}`);
        process.exit(0);
    } catch (error) {
        console.error('\n--- SEEDING FAILED ---');
        console.error(error);
        process.exit(1);
    }
};

seedNotifications();

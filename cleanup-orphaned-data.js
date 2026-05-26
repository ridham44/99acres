#!/usr/bin/env node

/**
 * Cleanup script for orphaned user data
 * Finds and removes records that reference users who no longer exist in the database
 * Works for ALL user types: user, broker, channel_partner, builder, admin, etc.
 * 
 * Usage: node cleanup-orphaned-data.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Load all models
const User = require('./models/user.model');
const Shortlist = require('./models/shortlist.model');
const PropertyVisit = require('./models/propertyVisit.model');
const OTP = require('./models/otp.model');
const Review = require('./models/review.model');
const Requirement = require('./models/requirement.model');
const SupportTicket = require('./models/supportTicket.model');
const UserStatus = require('./models/userStatus.model');
const UserSubscription = require('./models/userSubscription.model');
const LogLogin = require('./models/logLogin');
const Agent = require('./models/agent.model');
const Property = require('./models/property.model');
const PropertyDocument = require('./models/propertyDocument.model');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/99acres';

async function cleanupOrphanedData() {
    try {
        console.log('Starting cleanup of orphaned user data...\n');

        // Get all existing user IDs
        const allUsers = await User.find().select('_id');
        const userIds = new Set(allUsers.map(u => u._id.toString()));

        console.log(`Found ${userIds.size} active users in database\n`);

        let totalDeleted = 0;
        const deletionStats = {};

        // Define collections and their userId field names
        const collectionsToClean = [
            { model: Shortlist, fieldName: 'userId', name: 'Shortlists' },
            { model: PropertyVisit, fieldName: 'userId', name: 'Property Visits' },
            { model: OTP, fieldName: 'userId', name: 'OTPs' },
            { model: Review, fieldName: 'userId', name: 'Reviews' },
            { model: Requirement, fieldName: 'userId', name: 'Requirements' },
            { model: SupportTicket, fieldName: 'userId', name: 'Support Tickets' },
            { model: UserStatus, fieldName: 'userId', name: 'User Status' },
            { model: UserSubscription, fieldName: 'userId', name: 'User Subscriptions' },
            { model: LogLogin, fieldName: 'userId', name: 'Login Logs' },
            { model: Agent, fieldName: 'userId', name: 'Agent Profiles' },
        ];

        // Clean each collection
        console.log('Checking for orphaned records...\n');

        for (const collection of collectionsToClean) {
            const query = {};
            query[collection.fieldName] = { $nin: allUsers.map(u => u._id) };

            const orphanedCount = await collection.model.countDocuments(query);

            if (orphanedCount > 0) {
                console.log(`  Found ${orphanedCount} orphaned ${collection.name.toLowerCase()}`);
                const result = await collection.model.deleteMany(query);
                deletionStats[collection.name] = orphanedCount;
                totalDeleted += orphanedCount;
                console.log(`  ✓ Deleted ${result.deletedCount} records\n`);
            }
        }

        // Clean properties owned/managed by non-existent users
        console.log('Checking for properties owned by deleted users...\n');
        const orphanedProps = await Property.find({
            $or: [
                { ownerId: { $nin: allUsers.map(u => u._id) } },
                { dealerId: { $nin: allUsers.map(u => u._id) } }
            ]
        });

        if (orphanedProps.length > 0) {
            console.log(`  Found ${orphanedProps.length} orphaned properties`);
            const propertyIds = orphanedProps.map(p => p._id);

            // Delete property documents for these properties
            const docCount = await PropertyDocument.countDocuments({
                propertyId: { $in: propertyIds }
            });

            if (docCount > 0) {
                await PropertyDocument.deleteMany({
                    propertyId: { $in: propertyIds }
                });
                deletionStats['Property Documents'] = docCount;
                totalDeleted += docCount;
                console.log(`  ✓ Deleted ${docCount} property documents\n`);
            }

            // Delete the properties themselves
            await Property.deleteMany({
                _id: { $in: propertyIds }
            });
            deletionStats['Properties'] = orphanedProps.length;
            totalDeleted += orphanedProps.length;
            console.log(`  ✓ Deleted ${orphanedProps.length} properties\n`);
        }

        // Display summary
        console.log('\n========== CLEANUP SUMMARY ==========');
        console.log(`Total orphaned records removed: ${totalDeleted}\n`);

        if (totalDeleted === 0) {
            console.log('✓ No orphaned data found. Database is clean!');
        } else {
            console.log('Breakdown by type:');
            Object.entries(deletionStats).forEach(([type, count]) => {
                console.log(`  - ${type}: ${count}`);
            });
            console.log('\n✓ All orphaned data has been successfully removed!');
        }

        console.log('========== CLEANUP COMPLETE ==========\n');

        return {
            success: true,
            message: 'Orphaned data cleanup completed',
            orphanedRecordsRemoved: totalDeleted,
            stats: deletionStats,
        };
    } catch (error) {
        console.error('Fatal error during cleanup:', error.message);
        console.error(error.stack);
        return {
            success: false,
            message: error.message,
        };
    }
}

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const result = await cleanupOrphanedData();

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');

        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();

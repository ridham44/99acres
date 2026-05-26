#!/usr/bin/env node

/**
 * Database diagnostic script
 * Shows deleted users and orphaned data without removing anything
 * Works for ALL user types: user, broker, channel_partner, builder, admin, etc.
 * 
 * Usage: node diagnose-db.js
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

async function diagnoseMongo() {
    try {
        console.log('\n========== DATABASE DIAGNOSTIC REPORT ==========\n');

        // 1. Check for soft-deleted users
        console.log('1. SOFT-DELETED USERS (deletedAt is not null):');
        const softDeletedUsers = await User.find({ deletedAt: { $ne: null } }).select('_id name email phone deletedAt');
        if (softDeletedUsers.length > 0) {
            console.log(`   Found ${softDeletedUsers.length} soft-deleted users:`);
            softDeletedUsers.forEach(u => {
                console.log(`   - ${u.name} (${u.email}) - Deleted: ${u.deletedAt}`);
            });
        } else {
            console.log('   ✓ No soft-deleted users found\n');
        }

        // 2. Check all users
        console.log('\n2. ALL USERS IN DATABASE:');
        const allUsers = await User.find().select('_id name email');
        console.log(`   Total users: ${allUsers.length}`);
        const userIds = new Set(allUsers.map(u => u._id.toString()));

        // 3. Check for orphaned data
        console.log('\n3. ORPHANED DATA (records with deleted user references):');

        const collectionsToCheck = [
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

        let totalOrphanedRecords = 0;

        for (const collection of collectionsToCheck) {
            const query = {};
            query[collection.fieldName] = { $nin: allUsers.map(u => u._id) };
            const orphanedCount = await collection.model.countDocuments(query);

            if (orphanedCount > 0) {
                console.log(`   - ${collection.name}: ${orphanedCount} orphaned records`);
                totalOrphanedRecords += orphanedCount;
            }
        }

        // Check for orphaned properties
        const orphanedProps = await Property.countDocuments({
            $or: [
                { ownerId: { $nin: allUsers.map(u => u._id) } },
                { dealerId: { $nin: allUsers.map(u => u._id) } }
            ]
        });

        if (orphanedProps > 0) {
            console.log(`   - Properties: ${orphanedProps} orphaned records`);
            totalOrphanedRecords += orphanedProps;
        }

        // Check for property documents without valid properties
        const propIds = await Property.find().select('_id');
        const validPropIds = propIds.map(p => p._id);
        const orphanedDocs = await PropertyDocument.countDocuments({
            propertyId: { $nin: validPropIds }
        });

        if (orphanedDocs > 0) {
            console.log(`   - Property Documents: ${orphanedDocs} orphaned records`);
            totalOrphanedRecords += orphanedDocs;
        }

        if (totalOrphanedRecords === 0) {
            console.log('   ✓ No orphaned data found\n');
        } else {
            console.log(`\n   TOTAL ORPHANED RECORDS: ${totalOrphanedRecords}\n`);
        }

        // Summary
        console.log('========== SUMMARY ==========');
        console.log(`Total Users: ${allUsers.length}`);
        console.log(`Soft-Deleted Users: ${softDeletedUsers.length}`);
        console.log(`Orphaned Records: ${totalOrphanedRecords}`);
        console.log('\n');

        if (softDeletedUsers.length > 0) {
            console.log('→ Run: node cleanup-deleted-users.js');
            console.log('  (to remove data for soft-deleted users)\n');
        }

        if (totalOrphanedRecords > 0) {
            console.log('→ Run: node cleanup-orphaned-data.js');
            console.log('  (to remove orphaned data from hard-deleted users)\n');
        }

        console.log('========== END REPORT ==========\n');

    } catch (error) {
        console.error('Error during diagnosis:', error.message);
        console.error(error.stack);
    }
}

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        await diagnoseMongo();

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');

        process.exit(0);
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();

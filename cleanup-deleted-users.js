#!/usr/bin/env node

/**
 * Cleanup script for soft-deleted users and their orphaned data
 * Finds users with deletedAt field set and removes all their associated data
 * Works for ALL user types: user, broker, channel_partner, builder, admin, etc.
 * 
 * Usage: node cleanup-deleted-users.js
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Find all soft-deleted users (users with deletedAt != null)
 * 3. Remove all their associated data
 * 4. Display a detailed summary
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Load all models FIRST before using them
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

const { cleanupDeletedUsers } = require('./utils/cleanupDeletedUsers');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/99acres';

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const result = await cleanupDeletedUsers();

        // Disconnect from database
        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');

        // Exit with appropriate code
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('Fatal error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();

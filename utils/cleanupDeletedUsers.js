const mongoose = require('mongoose');
const User = require('../models/user.model');
const Shortlist = require('../models/shortlist.model');
const PropertyVisit = require('../models/propertyVisit.model');
const OTP = require('../models/otp.model');
const Review = require('../models/review.model');
const Requirement = require('../models/requirement.model');
const SupportTicket = require('../models/supportTicket.model');
const UserStatus = require('../models/userStatus.model');
const UserSubscription = require('../models/userSubscription.model');
const LogLogin = require('../models/logLogin');
const Agent = require('../models/agent.model');
const Property = require('../models/property.model');
const PropertyDocument = require('../models/propertyDocument.model');

async function cleanupDeletedUsers() {
    try {
        console.log('Starting cleanup of deleted users and their associated data...\n');

        // Find all soft-deleted users
        const deletedUsers = await User.find({ 
            deletedAt: { $ne: null } 
        }).select('_id name email phone');

        if (deletedUsers.length === 0) {
            console.log('✓ No deleted users found. Database is clean!');
            return { success: true, message: 'No cleanup needed' };
        }

        console.log(`Found ${deletedUsers.length} deleted user(s):\n`);
        deletedUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
        });
        console.log('\n');

        let totalCleaned = 0;
        const results = [];

        // Process each deleted user
        for (const user of deletedUsers) {
            const userId = user._id;
            console.log(`Cleaning data for user: ${user.name}...`);

            const counts = {
                userId: userId.toString(),
                userName: user.name,
                userEmail: user.email,
            };

            try {
                // Delete shortlists
                const shortlistCount = await Shortlist.countDocuments({ userId });
                await Shortlist.deleteMany({ userId });
                counts.shortlists = shortlistCount;

                // Delete property visits
                const visitCount = await PropertyVisit.countDocuments({ userId });
                await PropertyVisit.deleteMany({ userId });
                counts.propertyVisits = visitCount;

                // Delete OTPs
                const otpCount = await OTP.countDocuments({ userId });
                await OTP.deleteMany({ userId });
                counts.otps = otpCount;

                // Delete reviews
                const reviewCount = await Review.countDocuments({ userId });
                await Review.deleteMany({ userId });
                counts.reviews = reviewCount;

                // Delete requirements
                const requirementCount = await Requirement.countDocuments({ userId });
                await Requirement.deleteMany({ userId });
                counts.requirements = requirementCount;

                // Delete support tickets
                const ticketCount = await SupportTicket.countDocuments({ userId });
                await SupportTicket.deleteMany({ userId });
                counts.supportTickets = ticketCount;

                // Delete user status
                const statusCount = await UserStatus.countDocuments({ userId });
                await UserStatus.deleteMany({ userId });
                counts.userStatus = statusCount;

                // Delete user subscriptions
                const subCount = await UserSubscription.countDocuments({ userId });
                await UserSubscription.deleteMany({ userId });
                counts.userSubscriptions = subCount;

                // Delete login logs
                const logCount = await LogLogin.countDocuments({ userId });
                await LogLogin.deleteMany({ userId });
                counts.loginLogs = logCount;

                // Delete agent profile
                const agentCount = await Agent.countDocuments({ userId });
                await Agent.deleteMany({ userId });
                counts.agentProfiles = agentCount;

                // Find and delete properties and their documents
                const properties = await Property.find({
                    $or: [{ ownerId: userId }, { dealerId: userId }],
                });

                if (properties.length > 0) {
                    const propertyIds = properties.map(p => p._id);
                    const docCount = await PropertyDocument.countDocuments({
                        propertyId: { $in: propertyIds },
                    });
                    await PropertyDocument.deleteMany({
                        propertyId: { $in: propertyIds },
                    });
                    counts.propertyDocuments = docCount;
                }

                const propCount = await Property.countDocuments({
                    $or: [{ ownerId: userId }, { dealerId: userId }],
                });
                await Property.deleteMany({
                    $or: [{ ownerId: userId }, { dealerId: userId }],
                });
                counts.properties = propCount;

                const itemsDeleted = Object.values(counts).reduce((sum, val) => {
                    return typeof val === 'number' ? sum + val : sum;
                }, 0);

                totalCleaned += itemsDeleted;
                results.push(counts);

                console.log(`  ✓ Cleaned ${itemsDeleted} associated data items\n`);
            } catch (error) {
                console.error(`  ✗ Error cleaning user ${userId}: ${error.message}\n`);
            }
        }

        console.log('\n========== CLEANUP SUMMARY ==========');
        console.log(`Total deleted users processed: ${deletedUsers.length}`);
        console.log(`Total data items removed: ${totalCleaned}\n`);

        results.forEach((result, index) => {
            console.log(`User ${index + 1}: ${result.userName} (${result.userEmail})`);
            console.log(`  - Shortlists: ${result.shortlists || 0}`);
            console.log(`  - Property Visits: ${result.propertyVisits || 0}`);
            console.log(`  - OTPs: ${result.otps || 0}`);
            console.log(`  - Reviews: ${result.reviews || 0}`);
            console.log(`  - Requirements: ${result.requirements || 0}`);
            console.log(`  - Support Tickets: ${result.supportTickets || 0}`);
            console.log(`  - User Status: ${result.userStatus || 0}`);
            console.log(`  - Subscriptions: ${result.userSubscriptions || 0}`);
            console.log(`  - Login Logs: ${result.loginLogs || 0}`);
            console.log(`  - Agent Profiles: ${result.agentProfiles || 0}`);
            console.log(`  - Properties: ${result.properties || 0}`);
            console.log(`  - Property Documents: ${result.propertyDocuments || 0}\n`);
        });

        console.log('========== CLEANUP COMPLETE ==========\n');
        console.log('✓ All orphaned data has been successfully removed!');

        return {
            success: true,
            message: 'Cleanup completed successfully',
            deletedUsersCount: deletedUsers.length,
            totalItemsDeleted: totalCleaned,
            details: results,
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

module.exports = { cleanupDeletedUsers };

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from local workspace
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- STARTING ADMIN API COMPILATION INTEGRITY CHECK ---');

try {
    console.log('1. Testing mongoose & models load...');
    const Notification = require('../models/notification.model');
    const User = require('../models/user.model');
    const PropertyDocument = require('../models/propertyDocument.model');
    console.log('   [SUCCESS] All schemas loaded successfully.');

    console.log('2. Testing admin controller compilation with new property-docs APIs...');
    const adminController = require('../controllers/admin.controller');
    console.log('   [SUCCESS] Admin controller compiled successfully.');
    console.log('   Available methods:', Object.keys(adminController).filter(k => k.includes('Document') || k.includes('Prop')));

    console.log('3. Testing Express app integration with new admin routes...');
    const app = require('../app');
    console.log('   [SUCCESS] Express app and registered admin routes loaded successfully.');

    console.log('--- ALL ADMIN COMPILATION CHECKS PASSED SUCCESSFULLY ---');
    process.exit(0);
} catch (error) {
    console.error('--- INTEGRITY CHECK FAILED ---');
    console.error(error);
    process.exit(1);
}

require('dotenv').config();
const mongoose = require('mongoose');

// Register all schemas for cascades
require('../models/shortlist.model');
require('../models/propertyVisit.model');
require('../models/review.model');
require('../models/supportTicket.model');
require('../models/userStatus.model');
require('../models/userSubscription.model');
require('../models/agent.model');
require('../models/propertyDocument.model');

const User = require('../models/user.model');
const Property = require('../models/property.model');
const Requirement = require('../models/requirement.model');
const Inquiry = require('../models/inquiry.model');
const LogLogin = require('../models/logLogin');
const Otp = require('../models/otp.model');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/99acres';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testAdminEndpoints() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            dbName: process.env.DB_NAME || 'real_estate_db'
        });
        console.log('Connected to MongoDB.');

        // Cleanup any old test records
        await User.deleteMany({ phone: { $in: ['9999999999', '8888888888'] } });

        // 1. Create a test admin user
        const adminUser = await User.create({
            name: 'Admin Tester',
            phone: '9999999999',
            role: 'admin',
            email: 'admintester@example.com',
            isVerified: true
        });

        // 2. Create a test broker user
        const brokerUser = await User.create({
            name: 'Broker Tester',
            phone: '8888888888',
            role: 'broker',
            email: 'brokertester@example.com',
            isVerified: true
        });

        // 3. Create a property owned by the broker
        const testProperty = await Property.create({
            ownerId: brokerUser._id,
            title: 'Test Luxury Villa',
            propertyName: 'Gokuldham Society',
            propertyCategory: 'Residential',
            propertyType: 'Villa',
            listingType: 'Sale',
            city: 'Ahmedabad',
            city_area: 'Satellite',
            state: 'Gujarat',
            locality: 'Satellite Road',
            address: '102 Gokuldham, Ahmedabad',
            price: 15000000,
            priceUnit: 'total',
            area: 300,
            measureType: 'yard',
            status: 'Active'
        });

        // 4. Create a requirement for the broker
        const testRequirement = await Requirement.create({
            userId: brokerUser._id,
            transactionType: 'Buy',
            locations: ['Satellite'],
            propertyTypes: ['Villa'],
            minBudget: 10000000,
            maxBudget: 20000000,
            minArea: 200,
            maxArea: 400,
            bhks: [3, 4],
            status: 'Active'
        });

        // 5. Create an inquiry for the property
        const testInquiry = await Inquiry.create({
            userId: brokerUser._id,
            property_id: testProperty._id,
            username: 'Inquirer Name',
            email: 'inquirer@example.com',
            phoneNumber: '9876543210',
            message: 'I am interested in this property',
            isAgent: 'Yes'
        });

        console.log('Seeded test records.');

        // Step 2: Log in as admin to get a token
        console.log('Initiating admin login...');
        let res = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999' })
        });
        let data = await res.json();
        if (res.status !== 200 || !data.otp) {
            throw new Error(`Admin login failed: ${JSON.stringify(data)}`);
        }

        const otp = data.otp;

        console.log('Verifying admin login OTP...');
        res = await fetch(`${BASE_URL}/auth/admin/verify-login-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999', otp: otp, deviceId: 'test-device' })
        });
        data = await res.json();
        if (res.status !== 200 || !data.token) {
            throw new Error(`Admin OTP verification failed: ${JSON.stringify(data)}`);
        }

        const token = data.token;
        console.log('Admin token obtained successfully.');

        // Let's test each of the 6 admin endpoints:
        const authHeader = { 'Authorization': `Bearer ${token}` };

        // 1. GET /api/admin/users
        console.log('\n--- Test 1: GET /api/admin/users ---');
        res = await fetch(`${BASE_URL}/admin/users`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('Total users found:', data.total);
        if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
            throw new Error(`GET /admin/users failed: ${JSON.stringify(data)}`);
        }
        // Assert no admin is in the list
        const adminInList = data.data.find(u => u.role === 'admin');
        if (adminInList) {
            throw new Error('Found admin role in all users list!');
        }
        console.log('✅ GET /admin/users passed.');

        // 2. GET /api/admin/users/:id
        console.log(`\n--- Test 2: GET /api/admin/users/${brokerUser._id} ---`);
        res = await fetch(`${BASE_URL}/admin/users/${brokerUser._id}`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('User Name:', data.data?.user?.name);
        console.log('User Property List Count:', data.data?.properties?.length);
        console.log('User Property Summary:', data.data?.propertySummary);
        if (res.status !== 200 || !data.success || !data.data?.user || !data.data?.properties) {
            throw new Error(`GET /admin/users/:id failed: ${JSON.stringify(data)}`);
        }
        console.log('✅ GET /admin/users/:id passed.');

        // 3. GET /api/admin/properties
        console.log('\n--- Test 3: GET /api/admin/properties ---');
        res = await fetch(`${BASE_URL}/admin/properties`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('Total properties found:', data.total);
        if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
            throw new Error(`GET /admin/properties failed: ${JSON.stringify(data)}`);
        }
        console.log('✅ GET /admin/properties passed.');

        // 4. GET /api/admin/requirements
        console.log('\n--- Test 4: GET /api/admin/requirements ---');
        res = await fetch(`${BASE_URL}/admin/requirements`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('Total requirements found:', data.total);
        console.log('First requirement matched properties count:', data.data?.[0]?.matchedPropertyCount);
        if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
            throw new Error(`GET /admin/requirements failed: ${JSON.stringify(data)}`);
        }
        console.log('✅ GET /admin/requirements passed.');

        // 5. GET /api/admin/requirements/:id
        console.log(`\n--- Test 5: GET /api/admin/requirements/${testRequirement._id} ---`);
        res = await fetch(`${BASE_URL}/admin/requirements/${testRequirement._id}`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('Requirement User:', data.data?.requirement?.userId?.name);
        console.log('Requirement Matched Properties (limit 5):', data.data?.matchedProperties?.length);
        if (res.status !== 200 || !data.success || !data.data?.requirement || !Array.isArray(data.data?.matchedProperties)) {
            throw new Error(`GET /admin/requirements/:id failed: ${JSON.stringify(data)}`);
        }
        console.log('✅ GET /admin/requirements/:id passed.');

        // 6. GET /api/admin/inquiries
        console.log('\n--- Test 6: GET /api/admin/inquiries ---');
        res = await fetch(`${BASE_URL}/admin/inquiries`, { headers: authHeader });
        data = await res.json();
        console.log('Status:', res.status);
        console.log('Total inquiries found:', data.total);
        console.log('First inquiry properties detail is populated:', !!data.data?.[0]?.property_id);
        if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
            throw new Error(`GET /admin/inquiries failed: ${JSON.stringify(data)}`);
        }
        console.log('✅ GET /admin/inquiries passed.');

        console.log('\n--- CLEANING UP TEST DATA ---');
        await User.deleteOne({ _id: adminUser._id });
        await User.deleteOne({ _id: brokerUser._id });
        await Property.deleteOne({ _id: testProperty._id });
        await Requirement.deleteOne({ _id: testRequirement._id });
        await Inquiry.deleteOne({ _id: testInquiry._id });
        await LogLogin.deleteMany({ userId: adminUser._id });
        await LogLogin.deleteMany({ userId: brokerUser._id });
        await Otp.deleteMany({ userId: adminUser._id });
        await Otp.deleteMany({ userId: brokerUser._id });
        console.log('Cleanup completed successfully.');
        console.log('\n🎉 ALL ADMIN API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');

    } catch (err) {
        console.error('\n❌ Test execution failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

testAdminEndpoints();

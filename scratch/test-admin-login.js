require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const LogLogin = require('../models/logLogin');
const Otp = require('../models/otp.model');

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/99acres';
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function setupTestData() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
        dbName: process.env.DB_NAME || 'real_estate_db'
    });
    console.log('Connected to MongoDB.');

    // 1. Create a test admin user
    await User.deleteOne({ phone: '9999999999' });
    const adminUser = await User.create({
        name: 'Test Admin',
        phone: '9999999999',
        role: 'admin',
        email: 'testadmin@example.com',
        isVerified: true
    });
    console.log('Created test admin user:', adminUser.name, adminUser.phone);

    // 2. Create a test non-admin user
    await User.deleteOne({ phone: '8888888888' });
    const regularUser = await User.create({
        name: 'Test Regular User',
        phone: '8888888888',
        role: 'user',
        email: 'testuser@example.com',
        isVerified: true
    });
    console.log('Created test regular user:', regularUser.name, regularUser.phone);

    return { adminUser, regularUser };
}

async function testAdminLoginFlow() {
    try {
        const { adminUser, regularUser } = await setupTestData();

        console.log('\n--- STARTING TESTS ---');

        // Test 1: Try admin login with a non-existent phone number
        console.log('\nTest 1: Admin login with non-existent phone number...');
        let res = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '1111111111' })
        });
        let data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', data);
        if (res.status !== 404) throw new Error('Test 1 failed: Expected 404');

        // Test 2: Try admin login with a regular user phone number (non-admin)
        console.log('\nTest 2: Admin login with non-admin phone number...');
        res = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '8888888888' })
        });
        data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', data);
        if (res.status !== 403) throw new Error('Test 2 failed: Expected 403');

        // Test 3: Admin login with correct admin phone number
        console.log('\nTest 3: Admin login with correct admin phone...');
        res = await fetch(`${BASE_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999' })
        });
        data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', data);
        if (res.status !== 200 || !data.otp) throw new Error('Test 3 failed: Expected 200 and OTP');

        const otp = data.otp;

        // Test 4: Verify OTP with incorrect OTP
        console.log('\nTest 4: Verify admin login with incorrect OTP...');
        res = await fetch(`${BASE_URL}/auth/admin/verify-login-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999', otp: '000000' })
        });
        data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', data);
        if (res.status !== 400) throw new Error('Test 4 failed: Expected 400');

        // Test 5: Verify OTP with correct OTP
        console.log('\nTest 5: Verify admin login with correct OTP...');
        res = await fetch(`${BASE_URL}/auth/admin/verify-login-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: '9999999999', otp: otp, deviceId: 'test-device' })
        });
        data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', data);
        if (res.status !== 200 || !data.token) throw new Error('Test 5 failed: Expected 200 and token');

        const token = data.token;

        // Test 6: Access protected admin route (GET /api/auth/getAllUsers) using the token
        console.log('\nTest 6: Access protected admin route with token...');
        res = await fetch(`${BASE_URL}/auth/getAllUsers`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body (sample count):', data.success, 'Total users:', data.totalUsers);
        if (res.status !== 200) throw new Error('Test 6 failed: Expected 200');

        // Test 7: Verify that the log login shows isAdmin as true
        console.log('\nTest 7: Verify login logs database record...');
        const loginLog = await LogLogin.findOne({ userId: adminUser._id }).sort({ createdAt: -1 });
        console.log('Login Log Record:', {
            userId: loginLog.userId,
            isAdmin: loginLog.isAdmin,
            isLogin: loginLog.isLogin,
            token: loginLog.token ? 'exists' : 'missing'
        });
        if (!loginLog.isAdmin) throw new Error('Test 7 failed: LogLogin isAdmin should be true');

        console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');

        // Cleanup
        await User.deleteOne({ _id: adminUser._id });
        await User.deleteOne({ _id: regularUser._id });
        await LogLogin.deleteMany({ userId: adminUser._id });
        await LogLogin.deleteMany({ userId: regularUser._id });
        await Otp.deleteMany({ userId: adminUser._id });
        console.log('Cleanup completed.');

    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

testAdminLoginFlow();

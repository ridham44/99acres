require('dotenv').config();

const mongoose = require('mongoose');
const Bank = require('../models/bank.model');

const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb+srv://prakharwebearl_db_user:Ov3ffn5uGS3vlbcE@cluster0.g87arms.mongodb.net/real_estate_db?retryWrites=true&w=majority';

const banks = [
    {
        bankName: 'State Bank of India',
        bankIcon: 'SBI-Logo.png',
        interest: 8.5,
        about: 'Public sector bank offering home loans and retail banking across India.',
    },
    {
        bankName: 'Punjab National Bank',
        bankIcon: 'PunjabNationalBank.jpg',
        interest: 8.45,
        about: 'Public sector bank with home loan and housing finance products.',
    },
    {
        bankName: 'Bank of Baroda',
        bankIcon: 'BankofBaroda.png',
        interest: 8.4,
        about: 'Public sector bank providing housing loans and banking services.',
    },
    {
        bankName: 'Canara Bank',
        bankIcon: 'CanaraBank.png',
        interest: 8.4,
        about: 'Public sector bank offering home loans and financial services.',
    },
    {
        bankName: 'Union Bank of India',
        bankIcon: 'UnionBankofIndia.png',
        interest: 8.45,
        about: 'Public sector bank with housing loan and mortgage products.',
    },
    {
        bankName: 'Bank of India',
        bankIcon: 'BankofIndia.png',
        interest: 8.45,
        about: 'Public sector bank offering retail, housing, and business banking.',
    },
    {
        bankName: 'Indian Bank',
        bankIcon: 'IndianBank.png',
        interest: 8.4,
        about: 'Public sector bank providing home loans and personal banking services.',
    },
    {
        bankName: 'Indian Overseas Bank',
        bankIcon: 'IndianOverseasBank.png',
        interest: 8.5,
        about: 'Public sector bank offering home loan and retail banking services.',
    },
    {
        bankName: 'Central Bank of India',
        bankIcon: 'CentralBankofIndia.png',
        interest: 8.45,
        about: 'Public sector bank with housing finance and banking products.',
    },
    {
        bankName: 'UCO Bank',
        bankIcon: 'UCOBank.png',
        interest: 8.5,
        about: 'Public sector bank providing home loan and deposit services.',
    },
    {
        bankName: 'Bank of Maharashtra',
        bankIcon: 'BankofMaharashtra.png',
        interest: 8.35,
        about: 'Public sector bank offering housing loans and retail banking.',
    },
    {
        bankName: 'Punjab & Sind Bank',
        bankIcon: 'Punjab&SindBank.png',
        interest: 8.55,
        about: 'Public sector bank with home loan and banking services.',
    },
    {
        bankName: 'HDFC Bank',
        bankIcon: 'HDFCBank.png',
        interest: 8.6,
        about: 'Private sector bank offering home loans and retail banking services.',
    },
    {
        bankName: 'ICICI Bank',
        bankIcon: 'ICICIBank.png',
        interest: 8.75,
        about: 'Private sector bank providing housing loans and digital banking services.',
    },
    {
        bankName: 'Axis Bank',
        bankIcon: 'AxisBank.png',
        interest: 8.75,
        about: 'Private sector bank with home loan, mortgage, and banking products.',
    },
    {
        bankName: 'Kotak Mahindra Bank',
        bankIcon: 'KotakMahindraBank.png',
        interest: 8.7,
        about: 'Private sector bank offering home loans and retail financial services.',
    },
    {
        bankName: 'IndusInd Bank',
        bankIcon: 'IndusIndBank.jpg',
        interest: 8.85,
        about: 'Private sector bank providing mortgage and retail banking services.',
    },
    {
        bankName: 'Yes Bank',
        bankIcon: 'YesBank.png',
        interest: 8.95,
        about: 'Private sector bank offering housing finance and banking solutions.',
    },
    {
        bankName: 'IDFC FIRST Bank',
        bankIcon: 'IDFCFIRSTBank.png',
        interest: 8.75,
        about: 'Private sector bank with home loan and customer banking services.',
    },
    {
        bankName: 'Federal Bank',
        bankIcon: 'FederalBank.png',
        interest: 8.8,
        about: 'Private sector bank offering home loans and personal banking services.',
    },
    {
        bankName: 'Karur Vysya Bank',
        bankIcon: 'KarurVysyaBank.jpg',
        interest: 8.9,
        about: 'Private sector bank providing housing loans and financial services.',
    },
    {
        bankName: 'City Union Bank',
        bankIcon: 'CityUnionBank.jpg',
        interest: 8.95,
        about: 'Private sector bank offering retail and housing loan services.',
    },
    {
        bankName: 'Tamilnad Mercantile Bank',
        bankIcon: 'TamilnadMercantileBank.png',
        interest: 9.0,
        about: 'Private sector bank with home loan and banking products.',
    },
    {
        bankName: 'South Indian Bank',
        bankIcon: 'SouthIndianBank.png',
        interest: 8.95,
        about: 'Private sector bank providing home loans and retail banking.',
    },
    {
        bankName: 'Karnataka Bank',
        bankIcon: 'KarnatakaBank.png',
        interest: 8.9,
        about: 'Private sector bank offering housing finance and banking services.',
    },
    {
        bankName: 'Jammu & Kashmir Bank',
        bankIcon: 'Jammu&KashmirBank.png',
        interest: 8.9,
        about: 'Private sector bank offering home loan and financial services.',
    },
    {
        bankName: 'DCB Bank',
        bankIcon: 'DCBBank.png',
        interest: 9.1,
        about: 'Private sector bank providing mortgage and banking products.',
    },
    {
        bankName: 'RBL Bank',
        bankIcon: 'RBLBank.png',
        interest: 9.0,
        about: 'Private sector bank offering housing finance and personal banking.',
    },
    {
        bankName: 'Bandhan Bank',
        bankIcon: 'BandhanBank.jpg',
        interest: 8.85,
        about: 'Private sector bank providing retail banking and loan products.',
    },
    {
        bankName: 'Nainital Bank',
        bankIcon: 'NainitalBank.webp',
        interest: 9.05,
        about: 'Private sector bank offering home loan and retail banking services.',
    },
    {
        bankName: 'CSB Bank',
        bankIcon: 'CSBBank.png',
        interest: 8.95,
        about: 'Private sector bank providing housing loan and banking services.',
    },
    {
        bankName: 'Catholic Syrian Bank',
        bankIcon: 'CatholicSyrianBank.png',
        interest: 8.95,
        about: 'Private sector bank offering retail banking and home loan services.',
    },
    {
        bankName: 'Lakshmi Vilas Bank',
        bankIcon: 'LakshmiVilasBank.webp',
        interest: 9.15,
        about: 'Private sector bank entry seeded with the provided bank icon.',
    },
];

async function seedBanks() {
    try {
        await mongoose.connect(MONGO_URI, process.env.DB_NAME ? { dbName: process.env.DB_NAME } : {});

        const now = new Date();

        for (const bank of banks) {
            await Bank.updateOne(
                { bankName: bank.bankName },
                {
                    $set: {
                        ...bank,
                        deletedAt: null,
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                },
                { upsert: true }
            );
        }

        console.log(`Seeded ${banks.length} banks successfully.`);
    } catch (error) {
        console.error('Bank seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    seedBanks();
}

module.exports = {
    banks,
    seedBanks,
};

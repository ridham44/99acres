const mongoose = require('mongoose');
const Bank = require('../models/bank.model');
const status = require('../utils/statusCodes');
const { uploadToImagekit } = require('../utils/imagekitUpload');
const { getBankIconUrl } = require('../utils/imagekitUrl');

// Create Bank
exports.createBank = async (req, res) => {
    try {
        const { bankName, interest, about } = req.body;
        let bankIcon = null;

        if (req.file) {
            // Upload to ImageKit in 'banks/icons' folder
            const uploaded = await uploadToImagekit(req.file, 'banks/icons');
            bankIcon = uploaded.fileName;
        }

        const bank = await Bank.create({
            bankName,
            interest,
            about: about || '',
            bankIcon,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const bankObj = bank.toObject();
        if (bankObj.bankIcon) {
            bankObj.bankIconUrl = getBankIconUrl(bankObj.bankIcon);
        }

        return res.status(status.CREATED).json({
            success: true,
            message: 'Bank created successfully',
            data: bankObj,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Get All Banks
exports.getBanks = async (req, res) => {
    try {
        const { search, page, limit } = req.query;

        const filter = { deletedAt: null };

        if (search) {
            filter.bankName = { $regex: search, $options: 'i' };
        }

        const total = await Bank.countDocuments(filter);

        let query = Bank.find(filter).sort({ createdAt: -1 });

        let pagination = null;

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);

            query = query.skip((pageNumber - 1) * limitNumber).limit(limitNumber);

            pagination = {
                total,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(total / limitNumber),
            };
        }

        const banks = await query;

        const mappedBanks = banks.map((bank) => {
            const bankObj = bank.toObject();
            return {
                ...bankObj,
                bankIconUrl: bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null,
            };
        });

        return res.status(status.OK).json({
            success: true,
            message: 'Banks fetched successfully',
            data: mappedBanks,
            pagination,
            meta: {
                totalBanks: total,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Get Bank By ID
exports.getBankById = async (req, res) => {
    try {
        const { id } = req.params;

        const bank = await Bank.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!bank) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Bank not found',
            });
        }

        const bankObj = bank.toObject();
        bankObj.bankIconUrl = bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null;

        return res.status(status.OK).json({
            success: true,
            message: 'Bank fetched successfully',
            data: bankObj,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Update Bank
exports.updateBank = async (req, res) => {
    try {
        const { id } = req.params;
        const { bankName, interest, about } = req.body;

        const bank = await Bank.findOne({
            _id: id,
            deletedAt: null,
        });

        if (!bank) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Bank not found',
            });
        }

        if (bankName !== undefined) bank.bankName = bankName;
        if (interest !== undefined) bank.interest = interest;
        if (about !== undefined) bank.about = about;

        if (req.file) {
            // Upload to ImageKit in 'banks/icons' folder
            const uploaded = await uploadToImagekit(req.file, 'banks/icons');
            bank.bankIcon = uploaded.fileName;
        }

        bank.updatedAt = new Date();
        await bank.save();

        const bankObj = bank.toObject();
        bankObj.bankIconUrl = bankObj.bankIcon ? getBankIconUrl(bankObj.bankIcon) : null;

        return res.status(status.OK).json({
            success: true,
            message: 'Bank updated successfully',
            data: bankObj,
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete Bank (Soft Delete)
exports.deleteBank = async (req, res) => {
    try {
        const { id } = req.params;

        const bank = await Bank.findOneAndUpdate(
            {
                _id: id,
                deletedAt: null,
            },
            {
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
            { new: true }
        );

        if (!bank) {
            return res.status(status.NotFound).json({
                success: false,
                message: 'Bank not found',
            });
        }

        return res.status(status.OK).json({
            success: true,
            message: 'Bank deleted successfully',
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

// Hard Delete All Banks
exports.hardDeleteAllBanks = async (req, res) => {
    try {
        const result = await Bank.deleteMany({});

        return res.status(status.OK).json({
            success: true,
            message: 'All banks permanently deleted successfully',
            data: {
                deletedCount: result.deletedCount,
            },
        });
    } catch (error) {
        return res.status(status.InternalServerError).json({
            success: false,
            message: error.message,
        });
    }
};

const mongoose = require("mongoose");
const WinningPriceRange = require("../models/Winning_price_range");
const Admin = require("../models/admin");





exports.createWinningPrice = async (req, res) => {
    try {
        let adminId = req.user;

        // Checking if the admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { wpr_no, range } = req.body
        let newData = new WinningPriceRange({
            wpr_no,
            range
        });

        let result = await newData.save();

        res.status(200).json({
            success: true,
            message: "Winning Price Range Add Successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.updateWinningPriceRange = async (req, res) => {
    try {
        let adminId = req.user;

        // Checking if the admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const { id } = req.query;
        const { wpr_no, range } = req.body;

        const updatedData = await WinningPriceRange.findByIdAndUpdate(
            id,
            { wpr_no, range },
            { new: true }
        );

        if (!updatedData) {
            return res.status(404).json({
                success: false,
                message: 'Winning Price Range not found'
            });
        }

        res.status(200).json({
            success: true,
            message: "Winning Price Range Updated Successfully",
            data: updatedData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayWinningPriceRangeById = async (req, res) => {
    try {

        let adminId = req.user;

        // Checking if the admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const { id } = req.query;

        const winningPrice = await WinningPriceRange.findById(id);

        if (!winningPrice) {
            return res.status(404).json({
                success: false,
                message: 'Winning Price Range not found'
            });
        }

        res.status(200).json({
            success: true,
            message: "Winning Price Range Retrieved Successfully",
            data: winningPrice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayAllRangePrice = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        const allRanges = await WinningPriceRange.find();

        res.status(200).json({
            success: true,
            message: "All Winning Price Ranges Retrieved Successfully",
            data: allRanges
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.deletepriceRange = async (req, res) => {
    try {

        let adminId = req.user;

        // Checking if the admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const { id } = req.query;

        const deletedRange = await WinningPriceRange.findByIdAndDelete(id);

        if (!deletedRange) {
            return res.status(404).json({
                success: false,
                message: 'Winning Price Range not found'
            });
        }

        res.status(200).json({
            success: true,
            message: "Winning Price Range Deleted Successfully",
            data: deletedRange
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
const mongoose = require("mongoose");
const ContestType = require("../models/contestType");
const Admin = require("../models/admin");



exports.createContestType = async (req, res) => {
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
        let newContest = new ContestType({
            contest_type: req.body.contest_type
        });
        let result = await newContest.save();
        res.status(200).json({
            success: true,
            message: "Contest-Type Add Successfully",
            data: result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.editContestType = async (req, res) => {
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
        let { _id } = req.query

        let updatedData = await ContestType.findByIdAndUpdate(_id, req.body, { new: true })

        if (!updatedData) {
            return res.status(401).json({
                success: false,
                message: "Contest-Type Not Found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Contest-Type Updated Successfully",
            data: updatedData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayContestType = async (req, res) => {
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
        let displayData = await ContestType.find();

        if (!displayData) {
            return res.status(401).json({
                success: false,
                message: "Contest-Type Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contest-Type Find Successfully",
            data: displayData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.deleteContestType = async (req, res) => {
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
        let { _id } = req.query

        let deletedData = await ContestType.findByIdAndDelete(_id)

        if (!deletedData) {
            return res.status(401).json({
                success: false,
                message: "Contest-Type Not Found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Contest-Type Delete Successfully",
            data: deletedData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
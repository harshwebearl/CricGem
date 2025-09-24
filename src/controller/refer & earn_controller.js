const mongoose = require("mongoose");
const ReferAndEarn = require("../models/refer_&_earn");





exports.addReferAndEarn = async (req, res) => {
    try {
        let { question, answer } = req.body;

        let createData = new ReferAndEarn({
            question,
            answer
        });

        let result = await createData.save();

        res.status(200).json({
            success: true,
            message: "Add Refer And Earn Successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Read (Get all ReferAndEarn)
exports.getReferAndEarns = async (req, res) => {
    try {
        let results = await ReferAndEarn.find();

        res.status(200).json({
            success: true,
            message: "Fetch Refer And Earn Successfully",
            data: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Update
exports.updateReferAndEarn = async (req, res) => {
    try {
        let { id } = req.params;
        let { question, answer } = req.body;

        let result = await ReferAndEarn.findByIdAndUpdate(
            id,
            { question, answer },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Refer And Earn not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Update Refer And Earn Successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Delete
exports.deleteReferAndEarn = async (req, res) => {
    try {
        let { id } = req.params;

        let result = await ReferAndEarn.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Refer And Earn not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Delete Refer And Earn Successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
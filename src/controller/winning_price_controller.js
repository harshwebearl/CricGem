const mongoose = require("mongoose");
const WinningPrice = require("../models/winning_price");
const Admin = require("../models/admin")


exports.createWinnigPrice = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { range_price, contest_id } = req.body

        let newData = new WinningPrice({
            range_price,
            contest_id
        });
        let result = await newData.save();
        res.status(200).json({
            success: true,
            message: "Winning Price Create Successfully",
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

exports.editWinningPrice = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { id } = req.query
    
        let updatedData = await WinningPrice.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedData) {
            return res.status(401).json({
                success: false,
                message: "Winning Price Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Winning Price Update Successfully",
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

exports.displayWinningPrice = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { id } = req.query; // Assuming id is passed as a request parameter

        let displayDetails = await WinningPrice.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: 'contests',
                    localField: 'contest_id',
                    foreignField: '_id',
                    as: 'contest'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest.contest_type_id',
                    foreignField: '_id',
                    as: 'contest_type'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Winning Price Find Successfully",
            data: displayDetails
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayList = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let displayList = await WinningPrice.aggregate([
            {
                $lookup: {
                    from: 'contests',
                    localField: 'contest_id',
                    foreignField: '_id',
                    as: 'contest'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest.contest_type_id',
                    foreignField: '_id',
                    as: 'contest_type'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Winning Price Find Successfully",
            data: displayList
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.deleteWinningPrice = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { id } = req.query;

        const deletedWinningPrice = await WinningPrice.findByIdAndDelete(id);

        if (!deletedWinningPrice) {
            return res.status(404).json({
                success: false,
                message: 'Winning Price Range not found'
            });
        }

        res.status(200).json({
            success: true,
            message: "Winning Price Range Deleted Successfully",
            data: deletedWinningPrice
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
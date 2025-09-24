const MatchType = require("../models/MatchType");
const Admin = require("../models/admin");

exports.createMatchType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const { name, pointType } = req.body;
        const matchType = await MatchType.create({ name, pointType });
        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: matchType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.updateMatchType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const { name, pointType } = req.body;
        const newMatchType = { name, pointType };
        const matchTypeId = req.params.id;
        const matchType = await MatchType.findByIdAndUpdate(matchTypeId, { $set: newMatchType }, { new: true });
        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: matchType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.deleteMatchType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const matchTypeId = req.params.id;
        const matchType = await MatchType.findByIdAndDelete(matchTypeId);
        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: matchType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.getAllMatchType = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const allMatchType = await MatchType.find();
        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: allMatchType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
exports.getMatchTypeById = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        const id = req.params.id;
        const matchType = await MatchType.findById(id);
        return res.status(200).json({
            success: true,
            message: "Score added successfully",
            data: matchType,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
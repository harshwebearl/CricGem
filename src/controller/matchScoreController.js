const Admin = require("../models/admin");
const mongoose = require("mongoose")
const MatchScore = require("../models/MatchScore");
const SuperOver = require("../models/superOverSchema");
const SecoundSuperOver = require("../models/secound_super_over");

exports.getMatchScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const matchId = req.params.id;
        const matchScore = await MatchScore.aggregate([
            { $match: { matchId: new mongoose.Types.ObjectId(matchId) } },
            {
                $lookup: {
                    from: "teams", // The name of the Team collection
                    localField: "team1.teamId",
                    foreignField: "_id",
                    as: "team1.teamDetails"
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team2.teamId",
                    foreignField: "_id",
                    as: "team2.teamDetails"
                }
            },
            {
                $unwind: "$team1.teamDetails"
            },
            {
                $unwind: "$team2.teamDetails"
            }
        ]);

        if (!matchScore.length) {
            return res.status(404).json({
                success: false,
                message: "MatchScore not found",
            });
        }
        const BASE_URL_TEAM = 'https://cricgem-harsh.onrender.com/teamPhoto/'


        matchScore[0].team1.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.logo;
        matchScore[0].team1.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.other_photo;
        matchScore[0].team2.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.logo;
        matchScore[0].team2.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.other_photo;

        return res.status(200).json({
            success: true,
            message: "MatchScore fetched successfully",
            data: matchScore[0],
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

exports.getMatchSuperOverScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const matchId = req.params.id;
        const matchScore = await SuperOver.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                }
            },
            {
                $lookup: {
                    from: "teams", // The name of the Team collection
                    localField: "team1.teamId",
                    foreignField: "_id",
                    as: "team1.teamDetails"
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team2.teamId",
                    foreignField: "_id",
                    as: "team2.teamDetails"
                }
            },
            {
                $unwind: "$team1.teamDetails"
            },
            {
                $unwind: "$team2.teamDetails"
            }
        ]);

        if (!matchScore.length) {
            return res.status(404).json({
                success: false,
                message: "MatchScore not found",
            });
        }
        const BASE_URL_TEAM = 'https://cricgem-harsh.onrender.com/teamPhoto/'


        matchScore[0].team1.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.logo;
        matchScore[0].team1.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.other_photo;
        matchScore[0].team2.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.logo;
        matchScore[0].team2.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.other_photo;

        return res.status(200).json({
            success: true,
            message: "MatchScore fetched successfully",
            data: matchScore[0],
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

exports.getMatchSecoundSuperOverScore = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const matchId = req.params.id;
        const matchScore = await SecoundSuperOver.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                }
            },
            {
                $lookup: {
                    from: "teams", // The name of the Team collection
                    localField: "team1.teamId",
                    foreignField: "_id",
                    as: "team1.teamDetails"
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team2.teamId",
                    foreignField: "_id",
                    as: "team2.teamDetails"
                }
            },
            {
                $unwind: "$team1.teamDetails"
            },
            {
                $unwind: "$team2.teamDetails"
            }
        ]);

        if (!matchScore.length) {
            return res.status(404).json({
                success: false,
                message: "MatchScore not found",
            });
        }
        const BASE_URL_TEAM = 'https://cricgem-harsh.onrender.com/teamPhoto/'


        matchScore[0].team1.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.logo;
        matchScore[0].team1.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team1.teamDetails.other_photo;
        matchScore[0].team2.teamDetails.logo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.logo;
        matchScore[0].team2.teamDetails.other_photo = BASE_URL_TEAM + matchScore[0].team2.teamDetails.other_photo;

        return res.status(200).json({
            success: true,
            message: "MatchScore fetched successfully",
            data: matchScore[0],
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
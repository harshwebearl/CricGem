const mongoose = require("mongoose");
const Match = require("../models/match");
const Admin = require("../models/admin");
const User = require("../models/user");
const contest = require("../models/contest");
const match = require("../models/match");
const MatchScore = require("../models/MatchScore");
const ScoreBoard = require("../models/ScoreBoard");
const Notification = require("../models/notification");
const { getReceiverSocketId, io } = require("../socket/socket");
const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/'
const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/'

exports.insertMatch = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let {
            team_1_id,
            team_2_id,
            date,
            time,
            vanue,
            city,
            state,
            country,
            league_id,
            match_name,
            overs,
            innings
        } = req.body;
        let matchData = new Match({
            league_id,
            team_1_id,
            team_2_id,
            match_name,
            date,
            time,
            vanue,
            city,
            state,
            country,
            overs,
            innings
        });
        let result = await matchData.save();
        res.status(200).json({
            success: true,
            message: "Match Insert Successfully",
            data: result,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.displayList = async (req, res) => {
    try {
        // Extract admin ID from the request
        let adminId = req.user;

        // Find the admin
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let currentDate = new Date();

        let currentDate1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));

        // Extract league ID from the request query parameters
        let { leagueId } = req.query;

        // Aggregate matches based on leagueId
        let data = await Match.aggregate([
            {
                $match: {
                    league_id: new mongoose.Types.ObjectId(leagueId),
                    date: { $gte: currentDate1 }
                },
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.captain",
                    foreignField: "_id",
                    as: "team_1_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.vice_captain",
                    foreignField: "_id",
                    as: "team_1_viceCaptain_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.captain",
                    foreignField: "_id",
                    as: "team_2_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.vice_captain",
                    foreignField: "_id",
                    as: "team_2_viceCaptain_details",
                },
            },
        ]);

        data.forEach(match => {
            match.team_1_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            match.team_2_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            match.team_1_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_1_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_2_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_2_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
        });



        // Respond with the aggregated data
        res.status(200).json({
            success: true,
            message: "Matches found successfully",
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.displayMatchDetails = async (req, res) => {
    try {
        let adminId = req.user;

        // Find the admin
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let { matchId } = req.query;

        if (!matchId) {
            return res.status(401).json({
                success: false,
                message: "Match Not Found!",
            });
        }
        let data = await Match.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(matchId) },
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.captain",
                    foreignField: "_id",
                    as: "team_1_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.vice_captain",
                    foreignField: "_id",
                    as: "team_1_viceCaptain_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.captain",
                    foreignField: "_id",
                    as: "team_2_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.vice_captain",
                    foreignField: "_id",
                    as: "team_2_viceCaptain_details",
                },
            },
        ]);

        data.forEach(match => {
            match.team_1_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            match.team_2_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            match.team_1_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_1_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_2_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            match.team_2_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
        });

        res.status(200).json({
            success: true,
            message: "Matches found successfully",
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.editMatch = async (req, res) => {
    try {
        // Extract admin ID from the request
        let adminId = req.user;

        // Find the admin
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        // Extract match ID from the request query parameters
        let { matchId } = req.query;

        // Validate matchId
        if (!matchId) {
            return res.status(400).json({
                success: false,
                message: "Match ID not provided",
            });
        }

        // Find and update the match
        let updateData = await Match.findByIdAndUpdate(matchId, req.body, {
            new: true,
        });

        // Check if the match was found and updated
        if (!updateData) {
            return res.status(404).json({
                success: false,
                message: "Match not found",
            });
        }

        // Respond with the updated match data
        res.status(200).json({
            success: true,
            message: "Match updated successfully",
            data: updateData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.displayListByUser = async (req, res) => {
    try {
        // Extract admin ID from the request
        let userId = req.user;

        // Find the admin
        let admin = await User.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Aggregate matches based on leagueId
        let data = await Match.aggregate([
            {
                $lookup: {
                    from: "leagues",
                    localField: "league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.captain",
                    foreignField: "_id",
                    as: "team_1_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.vice_captain",
                    foreignField: "_id",
                    as: "team_1_viceCaptain_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.captain",
                    foreignField: "_id",
                    as: "team_2_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.vice_captain",
                    foreignField: "_id",
                    as: "team_2_viceCaptain_details",
                },
            },
        ]);

        // Respond with the aggregated data
        res.status(200).json({
            success: true,
            message: "Matches found successfully",
            data: data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.displayListByLeague = async (req, res) => {
    try {
        let userId = req.user;
        // test

        // Find the admin
        let admin = await Admin.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        let { leagueId } = req.query;

        let matchList = await Match.aggregate([
            {
                $match: { league_id: new mongoose.Types.ObjectId(leagueId) },
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.captain",
                    foreignField: "_id",
                    as: "team_1_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.vice_captain",
                    foreignField: "_id",
                    as: "team_1_viceCaptain_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.captain",
                    foreignField: "_id",
                    as: "team_2_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.vice_captain",
                    foreignField: "_id",
                    as: "team_2_viceCaptain_details",
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Matches List Find successfully",
            data: matchList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.displayListByLeagueId = async (req, res) => {
    try {
        let userId = req.user;

        // Find the admin
        let admin = await User.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        let { leagueId } = req.query;

        let currentDate = new Date();

        let currentDate1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));


        let matchList = await Match.aggregate([
            {
                $match: { league_id: new mongoose.Types.ObjectId(leagueId), date: { $gte: currentDate1 } },
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "_id",
                    foreignField: "match_id",
                    as: "contest",
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.captain",
                    foreignField: "_id",
                    as: "team_1_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_1_details.vice_captain",
                    foreignField: "_id",
                    as: "team_1_viceCaptain_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.captain",
                    foreignField: "_id",
                    as: "team_2_captain_details",
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team_2_details.vice_captain",
                    foreignField: "_id",
                    as: "team_2_viceCaptain_details",
                },
            },
            {
                $addFields: {
                    megaPrice: { $ifNull: [{ $max: "$contest.price_pool" }, 0] }
                }
            },
            {
                $addFields: {
                    "team_1_details.logo": {
                        $concat: [BASE_URL_TEAM, { $arrayElemAt: ["$team_1_details.logo", 0] }],
                    },
                    "team_1_details.other_photo": {
                        $concat: [BASE_URL_TEAM, { $arrayElemAt: ["$team_1_details.other_photo", 0] }],
                    },
                    "team_2_details.logo": {
                        $concat: [BASE_URL_TEAM, { $arrayElemAt: ["$team_2_details.logo", 0] }],
                    },
                    "team_2_details.other_photo": {
                        $concat: [BASE_URL_TEAM, { $arrayElemAt: ["$team_2_details.other_photo", 0] }],
                    },
                    "team_1_captain_details.player_photo": {
                        $concat: [BASE_URL_PLAYER, { $arrayElemAt: ["$team_1_captain_details.player_photo", 0] }],
                    },
                    "team_1_viceCaptain_details.player_photo": {
                        $concat: [BASE_URL_PLAYER, { $arrayElemAt: ["$team_1_viceCaptain_details.player_photo", 0] }],
                    },
                    "team_2_captain_details.player_photo": {
                        $concat: [BASE_URL_PLAYER, { $arrayElemAt: ["$team_2_captain_details.player_photo", 0] }],
                    },
                    "team_2_viceCaptain_details.player_photo": {
                        $concat: [BASE_URL_PLAYER, { $arrayElemAt: ["$team_2_viceCaptain_details.player_photo", 0] }],
                    },
                },
            },
            {
                $unset: "contest"
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Matches List Find successfully",
            data: matchList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
};

exports.displayContestsByMatchIdAdmin = async (req, res) => {
    try {
        let userId = req.user;

        // Find the admin
        let admin = await Admin.findById(userId);
        // let user = await User.findById(userId);
        let { matchId } = req.query;
        console.log(matchId);

        let contestList = await match.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "_id",
                    foreignField: "match_id",
                    as: "contests",
                },
            },
            {
                $unwind: {
                    path: "$contests",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "contest-types",
                    localField: "contests.contest_type_id",
                    foreignField: "_id",
                    as: "contest_type",
                },
            },
            // {
            //     $lookup: {
            //         from: "joincontests", // Collection name for joinContest
            //         localField: "contests._id",
            //         foreignField: "contest_id",
            //         as: "joined_contests",
            //     },
            // },
            // {
            //     $addFields: {
            //         "contests.contest_type": "$contest_type",
            //         "contests.joined_contests": "$joined_contests", // Add joined contest details to contests
            //     },
            // },
            {
                $unwind: {
                    path: "$contest_type",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "contests.contest_type": "$contest_type",
                },
            },
            {
                $group: {
                    _id: "$_id",
                    league_id: { $first: "$league_id" },
                    team_1_id: { $first: "$team_1_id" },
                    team_2_id: { $first: "$team_2_id" },
                    match_name: { $first: "$match_name" },
                    date: { $first: "$date" },
                    time: { $first: "$time" },
                    vanue: { $first: "$vanue" },
                    city: { $first: "$city" },
                    state: { $first: "$state" },
                    country: { $first: "$country" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    __v: { $first: "$__v" },
                    contests: {
                        $push: "$contests",
                    },
                },
            },
        ]);
        res.status(200).json({
            success: true,
            message: "All contests fetched successfully",
            data: contestList,
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




// exports.displayContestsByMatchId = async (req, res) => {
//     try {
//         let userId = req.user;
//         console.log("first")
//         // Find the admin or user
//         let admin = await Admin.findById(userId);
//         let user = await User.findById(userId);
//         let { matchId } = req.query;
//         console.log(matchId);

//         let contestList = await match.aggregate([
//             {
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(matchId),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "contests",
//                     localField: "_id",
//                     foreignField: "match_id",
//                     as: "contests",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$contests",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "contest-types",
//                     localField: "contests.contest_type_id",
//                     foreignField: "_id",
//                     as: "contest_type",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "joincontests", // Collection name for joinContest
//                     localField: "contests._id",
//                     foreignField: "contest_id",
//                     as: "joined_contests",
//                 },
//             },
//             {
//                 $addFields: {
//                     "contests.contest_type": { $arrayElemAt: ["$contest_type", 0] },
//                     "contests.joined_team_count": {
//                         $sum: {
//                             $map: { // Calculate the total joined teams by summing the lengths of myTeam_id arrays
//                                 input: "$joined_contests",
//                                 as: "joined",
//                                 in: { $size: "$$joined.myTeam_id" }
//                             }
//                         }
//                     }
//                 }
//             },
//             {
//                 $addFields: {
//                     "contests.remaining_spots": {
//                         $subtract: ["$contests.total_participant", "$contests.joined_team_count"]
//                     },
//                     "contests.joined_teams": "$contests.joined_team_count" // Alias for joined_team_count
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$_id",
//                     league_id: { $first: "$league_id" },
//                     team_1_id: { $first: "$team_1_id" },
//                     team_2_id: { $first: "$team_2_id" },
//                     match_name: { $first: "$match_name" },
//                     date: { $first: "$date" },
//                     time: { $first: "$time" },
//                     venue: { $first: "$venue" },
//                     city: { $first: "$city" },
//                     state: { $first: "$state" },
//                     country: { $first: "$country" },
//                     createdAt: { $first: "$createdAt" },
//                     updatedAt: { $first: "$updatedAt" },
//                     __v: { $first: "$__v" },
//                     contests: { $push: "$contests" },
//                 },
//             },
//         ]);



//         res.status(200).json({
//             success: true,
//             message: "All contests fetched successfully",
//             data: contestList,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };


exports.displayContestsByMatchId = async (req, res) => {
    try {
        let userId = req.user;
        console.log("secound")

        // Find the admin or user
        let admin = await Admin.findById(userId);
        let user = await User.findById(userId);
        let { matchId } = req.query;

        let contestList = await match.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "_id",
                    foreignField: "match_id",
                    as: "contests",
                },
            },
            {
                $unwind: {
                    path: "$contests",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "contest-types",
                    localField: "contests.contest_type_id",
                    foreignField: "_id",
                    as: "contest_type",
                },
            },
            {
                $lookup: {
                    from: "joincontests", // Collection name for joinContest
                    localField: "contests._id",
                    foreignField: "contest_id",
                    as: "joined_contests",
                },
            },
            {
                $lookup: {
                    from: "contest_details", // Collection name for contest details
                    localField: "contests._id",
                    foreignField: "contest_id",
                    as: "contest_detail",
                },
            },
            {
                $match: {
                    "contest_detail": { $ne: [] }
                }
            },
            {
                $addFields: {
                    "contests.contest_type": { $arrayElemAt: ["$contest_type", 0] },
                    "contests.joined_team_count": {
                        $sum: {
                            $map: {
                                input: "$joined_contests",
                                as: "joined",
                                in: { $size: "$$joined.myTeam_id" }
                            }
                        }
                    },
                    "contests.contest_detail": { $arrayElemAt: ["$contest_detail", 0] },
                }
            },
            {
                $addFields: {
                    "contests.remaining_spots": {
                        $subtract: ["$contests.total_participant", "$contests.joined_team_count"]
                    },
                    "contests.maxAmtDistro": {
                        $multiply: [
                            { $multiply: ["$contests.total_participant", "$contests.entry_fees"] },
                            { $subtract: [1, { $divide: ["$contests.profit", 100] }] }
                        ]
                    },
                    "contests.currAmtDistro": {
                        $multiply: [
                            { $multiply: ["$contests.joined_team_count", "$contests.entry_fees"] },
                            { $subtract: [1, { $divide: ["$contests.profit", 100] }] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    "contests.maxWinning": {
                        $map: {
                            input: "$contests.contest_detail.rankes",
                            as: "rank",
                            in: {
                                range: "$$rank.range",
                                prize: {
                                    $toString: {
                                        $round: [
                                            "$$rank.price"
                                            // { $multiply: ["$contests.maxAmtDistro", { $divide: ["$$rank.percent", 100] }] },
                                            // 0
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    "contests.currWinnings": {
                        $map: {
                            input: "$contests.contest_detail.rankes",
                            as: "rank",
                            in: {
                                range: "$$rank.range",
                                prize: {
                                    $toString: {
                                        $round: [
                                            {
                                                $multiply: [
                                                    "$contests.currAmtDistro",
                                                    {
                                                        $divide: [
                                                            {
                                                                $divide: ["$$rank.percent", { $size: "$$rank.range" }]
                                                            },
                                                            100
                                                        ]
                                                    }
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                $unset: [
                    "contests.contest_detail",
                    "contests.maxAmtDistro",
                    "contests.currAmtDistro"
                ] // Remove the unnecessary fields
            },
            {
                $match: {
                    "contests.remaining_spots": { $gt: 0 } // Exclude full contests
                }
            },
            {
                $group: {
                    _id: "$_id",
                    league_id: { $first: "$league_id" },
                    team_1_id: { $first: "$team_1_id" },
                    team_2_id: { $first: "$team_2_id" },
                    match_name: { $first: "$match_name" },
                    date: { $first: "$date" },
                    time: { $first: "$time" },
                    venue: { $first: "$venue" },
                    city: { $first: "$city" },
                    state: { $first: "$state" },
                    country: { $first: "$country" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    __v: { $first: "$__v" },
                    contests: { $push: "$contests" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "All contests fetched successfully",
            data: contestList,
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





exports.startMatch = async (req, res) => {
    try {
        let userId = req.user;
        let admin = await Admin.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const matchId = req.params.id;
        const { toss } = req.body;
        console.log(toss);
        console.log(req.body);

        let match = await Match.findById(matchId);
        if (match.isStarted) {
            return res
                .status(400)
                .json({ success: false, message: "Match is already Started" });
        }
        match = await Match.findByIdAndUpdate(
            matchId,
            { isStarted: true },
            { new: true }
        );


        let battingTeam;
        let ballingTeam;
        if (toss.choice === "Bat") {
            battingTeam = toss.teamId;
            ballingTeam =
                toss.teamId == match.team_1_id
                    ? match.team_2_id
                    : match.team_1_id;
        } else {
            ballingTeam = toss.teamId;
            battingTeam =
                toss.teamId == match.team_1_id
                    ? match.team_2_id
                    : match.team_1_id;
        }

        // for(const i=0; i<=match.innings; i++){
        await ScoreBoard.create({
            matchId,
            inning: 1,
            battingTeam,
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam,
            batting: [],
            balling: [],
        });
        // }

        const match_score = await MatchScore.create({
            matchId,
            toss,
            team1: {
                teamId: battingTeam,
                runs: 0,
                wicket: 0,
                overs: 0,
            },
            team2: {
                teamId: ballingTeam,
                runs: 0,
                wicket: 0,
                overs: 0,
            },
        });

        res.status(200).json({
            success: true,
            message: "Match is started",
            data: match,
        });

        let notification = await Notification.create({
            admin_id: ["676ea8e218bac679c8a33d8d", "662360442404c14853dc1949"],
            match_id: matchId,
            title: "Match Started",
            message: `The match ${match.match_name} has started!`,
        });

        notification.admin_id.forEach(adminId => {
            const socketId = getReceiverSocketId(adminId);
            console.log("socketId match start::", socketId)
            if (socketId) {
                io.to(socketId).emit('newNotification', notification);
            }
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


exports.complateMatch = async (req, res) => {
    try {
        let { matchId } = req.query
        let userId = req.user;
        let admin = await Admin.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let match = await Match.findByIdAndUpdate(matchId, { isComplated: true }, { new: true });

        if (!match) {
            return res.status(400).json({
                success: false,
                message: "Match Not Found!",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Match Has Complated",
            data: match
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    }
}


exports.matchList = async (req, res) => {
    try {
        let userId = req.user;
        // test

        // Find the admin
        let admin = await Admin.findById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        let currentDate = new Date();

        let currentDate1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));

        console.log(currentDate1);

        let { leagueId } = req.query;

        let matchList = await Match.aggregate([
            {
                $match: { league_id: new mongoose.Types.ObjectId(leagueId), date: { $gte: currentDate1 } },

            },
            // {
            //     $lookup: {
            //         from: "leagues",
            //         localField: "league_id",
            //         foreignField: "_id",
            //         as: "league_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "teams",
            //         localField: "team_1_id",
            //         foreignField: "_id",
            //         as: "team_1_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team_1_details.captain",
            //         foreignField: "_id",
            //         as: "team_1_captain_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team_1_details.vice_captain",
            //         foreignField: "_id",
            //         as: "team_1_viceCaptain_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "teams",
            //         localField: "team_2_id",
            //         foreignField: "_id",
            //         as: "team_2_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team_2_details.captain",
            //         foreignField: "_id",
            //         as: "team_2_captain_details",
            //     },
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team_2_details.vice_captain",
            //         foreignField: "_id",
            //         as: "team_2_viceCaptain_details",
            //     },
            // },
        ]);

        res.status(200).json({
            success: true,
            message: "Matches List Find successfully",
            data: matchList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message, // Include detailed error message for debugging
        });
    }
}
const Admin = require("../models/admin");
const Match = require("../models/match");
const ScoreBoard = require("../models/ScoreBoard");
const mongoose = require("mongoose");
const SuperOver = require("../models/superOverSchema");
const SecoundSuperOver = require("../models/secound_super_over");

exports.getScoreBoard = async (req, res) => {
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
        const inning = req.query.inning;

        const scoreBoard = await ScoreBoard.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                    inning: parseInt(inning),
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "battingTeam",
                    foreignField: "_id",
                    as: "battingTeamDetails",
                },
            },
            { $unwind: "$battingTeamDetails" },
            {
                $lookup: {
                    from: "teams",
                    localField: "ballingTeam",
                    foreignField: "_id",
                    as: "ballingTeamDetails",
                },
            },
            { $unwind: "$ballingTeamDetails" },
            {
                $unwind: {
                    path: "$batting",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.playerId",
                    foreignField: "_id",
                    as: "batting.playerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.playerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.ballerId",
                    foreignField: "_id",
                    as: "batting.outBy.ballerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.ballerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.secondaryPlayerId",
                    foreignField: "_id",
                    as: "batting.outBy.secondaryPlayerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.secondaryPlayerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.assistingPlayerId",
                    foreignField: "_id",
                    as: "batting.outBy.thirdPlayerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.thirdPlayerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    matchId: { $first: "$matchId" },
                    inning: { $first: "$inning" },
                    battingTeam: { $first: "$battingTeam" },
                    ballingTeam: { $first: "$ballingTeam" },
                    battingTeamDetails: { $first: "$battingTeamDetails" },
                    ballingTeamDetails: { $first: "$ballingTeamDetails" },
                    extras: { $first: "$extras" },
                    batting: { $push: "$batting" },
                    balling: { $first: "$balling" },
                },
            },
            {
                $unwind: {
                    path: "$balling",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "balling.playerId",
                    foreignField: "_id",
                    as: "balling.playerDetails",
                },
            },
            {
                $unwind: {
                    path: "$balling.playerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    matchId: { $first: "$matchId" },
                    inning: { $first: "$inning" },
                    battingTeam: { $first: "$battingTeam" },
                    ballingTeam: { $first: "$ballingTeam" },
                    battingTeamDetails: { $first: "$battingTeamDetails" },
                    ballingTeamDetails: { $first: "$ballingTeamDetails" },
                    extras: { $first: "$extras" },
                    batting: { $first: "$batting" },
                    balling: { $push: "$balling" },
                },
            },
        ]);

        if (scoreBoard.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Scorecard not found",
            });
        }

        const updatedScoreBoard = scoreBoard[0];

        const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/'
        const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/'


        // Update team photo URLs with team base URL
        updatedScoreBoard.battingTeamDetails.logo = `${BASE_URL_TEAM}${updatedScoreBoard.battingTeamDetails.logo}`;
        updatedScoreBoard.battingTeamDetails.other_photo = `${BASE_URL_TEAM}${updatedScoreBoard.battingTeamDetails.other_photo}`;
        updatedScoreBoard.ballingTeamDetails.logo = `${BASE_URL_TEAM}${updatedScoreBoard.ballingTeamDetails.logo}`;
        updatedScoreBoard.ballingTeamDetails.other_photo = `${BASE_URL_TEAM}${updatedScoreBoard.ballingTeamDetails.other_photo}`;

        if (updatedScoreBoard.batting && Array.isArray(updatedScoreBoard.batting)) {
            for (let i = 0; i < updatedScoreBoard.batting.length; i++) {
                if (updatedScoreBoard.batting[i].playerDetails) {
                    updatedScoreBoard.batting[i].playerDetails.player_photo = `${BASE_URL_PLAYER}${updatedScoreBoard.batting[i].playerDetails.player_photo}`;
                }
                if (updatedScoreBoard.batting[i].outBy && updatedScoreBoard.batting[i].outBy.ballerDetails) {
                    updatedScoreBoard.batting[i].outBy.ballerDetails.player_photo = `${BASE_URL_PLAYER}${updatedScoreBoard.batting[i].outBy.ballerDetails.player_photo}`;
                }
                if (updatedScoreBoard.batting[i].outBy && updatedScoreBoard.batting[i].outBy.secondaryPlayerDetails) {
                    updatedScoreBoard.batting[i].outBy.secondaryPlayerDetails.player_photo = `${BASE_URL_PLAYER}${updatedScoreBoard.batting[i].outBy.secondaryPlayerDetails.player_photo}`;
                }
                if (updatedScoreBoard.batting[i].outBy && updatedScoreBoard.batting[i].outBy.thirdPlayerDetails) {
                    updatedScoreBoard.batting[i].outBy.thirdPlayerDetails.player_photo = `${BASE_URL_PLAYER}${updatedScoreBoard.batting[i].outBy.thirdPlayerDetails.player_photo}`;
                }
            }
        }

        // Update player photos in the balling array
        if (updatedScoreBoard.balling && Array.isArray(updatedScoreBoard.balling)) {
            for (let i = 0; i < updatedScoreBoard.balling.length; i++) {
                if (updatedScoreBoard.balling[i].playerDetails) {
                    updatedScoreBoard.balling[i].playerDetails.player_photo = `${BASE_URL_PLAYER}${updatedScoreBoard.balling[i].playerDetails.player_photo}`;
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Scorecard fetched successfully",
            data: scoreBoard[0],
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

exports.getScoreBoardByMatchId = async (req, res) => {
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

        const scoreBoard = await ScoreBoard.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "battingTeam",
                    foreignField: "_id",
                    as: "battingTeamDetails",
                },
            },
            { $unwind: "$battingTeamDetails" },
            {
                $lookup: {
                    from: "teams",
                    localField: "ballingTeam",
                    foreignField: "_id",
                    as: "ballingTeamDetails",
                },
            },
            { $unwind: "$ballingTeamDetails" },
            { $unwind: { path: "$batting", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.playerId",
                    foreignField: "_id",
                    as: "batting.playerDetails",
                },
            },
            { $unwind: { path: "$batting.playerDetails", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { matchId: "$matchId", inning: "$inning" },
                    matchId: { $first: "$matchId" },
                    inning: { $first: "$inning" },
                    battingTeam: { $first: "$battingTeam" },
                    ballingTeam: { $first: "$ballingTeam" },
                    battingTeamDetails: { $first: "$battingTeamDetails" },
                    ballingTeamDetails: { $first: "$ballingTeamDetails" },
                    extras: { $first: "$extras" },
                    batting: { $push: "$batting" },
                    balling: { $push: "$balling" },
                },
            },
        ]);

        if (scoreBoard.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Scorecard not found",
            });
        }

        const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/';
        const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/';

        scoreBoard.forEach((inning) => {
            inning.battingTeamDetails.logo = `${BASE_URL_TEAM}${inning.battingTeamDetails.logo}`;
            inning.battingTeamDetails.other_photo = `${BASE_URL_TEAM}${inning.battingTeamDetails.other_photo}`;
            inning.ballingTeamDetails.logo = `${BASE_URL_TEAM}${inning.ballingTeamDetails.logo}`;
            inning.ballingTeamDetails.other_photo = `${BASE_URL_TEAM}${inning.ballingTeamDetails.other_photo}`;

            if (inning.batting && Array.isArray(inning.batting)) {
                inning.batting.forEach((bat) => {
                    if (bat.playerDetails) {
                        bat.playerDetails.player_photo = `${BASE_URL_PLAYER}${bat.playerDetails.player_photo}`;
                    }
                });
            }

            if (inning.balling && Array.isArray(inning.balling)) {
                inning.balling.forEach((ball) => {
                    if (ball.playerDetails) {
                        ball.playerDetails.player_photo = `${BASE_URL_PLAYER}${ball.playerDetails.player_photo}`;
                    }
                });
            }
        });

        return res.status(200).json({
            success: true,
            message: "Scorecard fetched successfully",
            data: scoreBoard,
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

// exports.getScoreBoard = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }

//         const matchId = req.params.id;
//         const inning = req.query.inning;

//         const scoreBoard = await ScoreBoard.aggregate([
//             {
//                 $match: {
//                     matchId: new mongoose.Types.ObjectId(matchId),
//                     inning: parseInt(inning),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "teams",
//                     localField: "battingTeam",
//                     foreignField: "_id",
//                     as: "battingTeamDetails",
//                 },
//             },
//             { $unwind: "$battingTeamDetails" },
//             {
//                 $lookup: {
//                     from: "teams",
//                     localField: "ballingTeam",
//                     foreignField: "_id",
//                     as: "ballingTeamDetails",
//                 },
//             },
//             { $unwind: "$ballingTeamDetails" },
//             {
//                 $unwind: {
//                     path: "$batting",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "batting.playerId",
//                     foreignField: "_id",
//                     as: "batting.playerDetails",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$batting.playerDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "batting.outBy.ballerId",
//                     foreignField: "_id",
//                     as: "batting.outBy.ballerDetails",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$batting.outBy.ballerDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "batting.outBy.secondaryPlayerId",
//                     foreignField: "_id",
//                     as: "batting.outBy.secondaryPlayerDetails",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$batting.outBy.secondaryPlayerDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id",
//                     matchId: { $first: "$matchId" },
//                     inning: { $first: "$inning" },
//                     battingTeam: { $first: "$battingTeam" },
//                     ballingTeam: { $first: "$ballingTeam" },
//                     battingTeamDetails: { $first: "$battingTeamDetails" },
//                     ballingTeamDetails: { $first: "$ballingTeamDetails" },
//                     extras: { $first: "$extras" },
//                     batting: { $push: "$batting" },
//                     balling: { $first: "$balling" },
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$balling",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "balling.playerId",
//                     foreignField: "_id",
//                     as: "balling.playerDetails",
//                 },
//             },
//             {
//                 $unwind: {
//                     path: "$balling.playerDetails",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id",
//                     matchId: { $first: "$matchId" },
//                     inning: { $first: "$inning" },
//                     battingTeam: { $first: "$battingTeam" },
//                     ballingTeam: { $first: "$ballingTeam" },
//                     battingTeamDetails: { $first: "$battingTeamDetails" },
//                     ballingTeamDetails: { $first: "$ballingTeamDetails" },
//                     extras: { $first: "$extras" },
//                     batting: { $first: "$batting" },
//                     balling: { $push: "$balling " },
//                 },
//             },
//         ]);

//         if (scoreBoard.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Scorecard not found",
//             });
//         }

//         const updatedScoreBoard = scoreBoard[0];

//         const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/';
//         const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/';

//         // Update team photo URLs with team base URL
//         updatedScoreBoard.battingTeamDetails.logo = `${BASE_URL_TEAM}${updatedScoreBoard.battingTeamDetails.logo}`;
//         updatedScoreBoard.battingTeamDetails.other_photo = `${BASE_URL_TEAM}${updatedScoreBoard.battingTeamDetails.other_photo}`;
//         updatedScoreBoard.ballingTeamDetails.logo = `${BASE_URL_TEAM}${updatedScoreBoard.ballingTeamDetails.logo}`;
//         updatedScoreBoard.ballingTeamDetails.other_photo = `${BASE_URL_TEAM}${updatedScoreBoard.ballingTeamDetails.other_photo}`;

//         // Update player photo URLs with player base URL
//         updatedScoreBoard.batting.forEach(batter => {
//             if (batter.playerDetails) {
//                 batter.playerDetails.player_photo = `${BASE_URL_PLAYER}${batter.playerDetails.player_photo}`;
//             }
//             if (batter.outBy.ballerDetails) {
//                 batter.outBy.ballerDetails.player_photo = `${BASE_URL_PLAYER}${batter.outBy.ballerDetails.player_photo}`;
//             }
//             if (batter.outBy.secondaryPlayerDetails) {
//                 batter.outBy.secondaryPlayerDetails.player_photo = `${BASE_URL_PLAYER}${batter.outBy.secondaryPlayerDetails.player_photo}`;
//             }
//         });

//         updatedScoreBoard.balling.forEach(bowler => {
//             if (bowler.playerDetails) {
//                 bowler.playerDetails.player_photo = `${BASE_URL_PLAYER}${bowler.playerDetails.player_photo}`;
//             }
//         });

//         return res.status(200).json({
//             success: true,
//             message: "Scorecard fetched successfully",
//             data: updatedScoreBoard,
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

exports.getUserScoreBoard = async (req, res) => {
    try {
        const matchId = req.params.id;

        // Find the scoreboard for the match without the inning query parameter
        const scoreBoard = await ScoreBoard.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "battingTeam",
                    foreignField: "_id",
                    as: "battingTeamDetails",
                },
            },
            { $unwind: "$battingTeamDetails" },
            {
                $lookup: {
                    from: "teams",
                    localField: "ballingTeam",
                    foreignField: "_id",
                    as: "ballingTeamDetails",
                },
            },
            { $unwind: "$ballingTeamDetails" },
            {
                $unwind: {
                    path: "$batting",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.playerId",
                    foreignField: "_id",
                    as: "batting.playerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.playerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.ballerId",
                    foreignField: "_id",
                    as: "batting.outBy.ballerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.ballerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.secondaryPlayerId",
                    foreignField: "_id",
                    as: "batting.outBy.secondaryPlayerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.secondaryPlayerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "batting.outBy.assistingPlayerId",
                    foreignField: "_id",
                    as: "batting.outBy.thirdPlayerDetails",
                },
            },
            {
                $unwind: {
                    path: "$batting.outBy.thirdPlayerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    matchId: { $first: "$matchId" },
                    inning: { $first: "$inning" },
                    battingTeam: { $first: "$battingTeam" },
                    ballingTeam: { $first: "$ballingTeam" },
                    battingTeamDetails: { $first: "$battingTeamDetails" },
                    ballingTeamDetails: { $first: "$ballingTeamDetails" },
                    extras: { $first: "$extras" },
                    batting: { $push: "$batting" },
                    balling: { $first: "$balling" },
                },
            },
            {
                $unwind: {
                    path: "$balling",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "balling.playerId",
                    foreignField: "_id",
                    as: "balling.playerDetails",
                },
            },
            {
                $unwind: {
                    path: "$balling.playerDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: "$_id",
                    matchId: { $first: "$matchId" },
                    inning: { $first: "$inning" },
                    battingTeam: { $first: "$battingTeam" },
                    ballingTeam: { $first: "$ballingTeam" },
                    battingTeamDetails: { $first: "$battingTeamDetails" },
                    ballingTeamDetails: { $first: "$ballingTeamDetails" },
                    extras: { $first: "$extras" },
                    batting: { $first: "$batting" },
                    balling: { $push: "$balling" },
                },
            },
            {
                $project: {
                    matchId: 1,
                    inning: 1, // Add inning to the projection
                    battingTeam: 1,
                    ballingTeam: 1,
                    battingTeamDetails: 1,
                    ballingTeamDetails: 1,
                    extras: 1,
                    batting: 1,
                    balling: 1,
                    totalRuns: {
                        $add: [
                            { $sum: "$batting.runs" },
                            { $add: ["$extras.nb", "$extras.wide", "$extras.legByes", "$extras.byes", "$extras.penalty"] },
                        ],
                    },
                    totalWickets: {
                        $size: {
                            $filter: {
                                input: "$batting",
                                as: "player",
                                cond: { $eq: ["$$player.isOut", true] },
                            },
                        },
                    },
                    totalBalls: {
                        $sum: "$balling.balls",
                    },
                },
            },
        ]);

        if (scoreBoard.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Scoreboard not found for this match",
            });
        }

        // // Prepare response scores
        // let team1Score = '0/0 (0.0)';
        // let team2Score = '0/0 (0.0)';
        // let team1Name = '';
        // let team1Id = '';
        // let team2Name = '';
        // let team2Id = '';
        // let batting1Players = '';
        // let bowling1Players = '';
        // let batting2Players = '';
        // let bowling2Players = '';
        // // Variables to store inning 1 score
        // let inning1Score = '';
        // let inning1Wickets = 0;
        // let inning1Balls = 0;

        // // Iterate through scoreBoard data to fetch scores
        // scoreBoard.forEach((data) => {
        //     // Assign team names
        //     if (!team1Name) team1Name = data.battingTeamDetails.team_name;
        //     if (!team1Id) team1Id = data.battingTeamDetails._id;
        //     if (!team2Name) team2Name = data.ballingTeamDetails.team_name;
        //     if (!team2Id) team2Id = data.ballingTeamDetails._id;
        //     if (!batting1Players) batting1Players = data.batting;
        //     if (!batting2Players) batting2Players = data.batting;
        //     if (!bowling1Players) bowling1Players = data.balling;
        //     if (!bowling2Players) bowling2Players = data.balling;

        //     if (data.inning === 1) {
        //         // For inning 1, display score of the batting team
        //         inning1Score = data.totalRuns || 0;
        //         inning1Wickets = data.totalWickets || 0;
        //         inning1Balls = data.totalBalls || 0;

        //         // Inning 1 batting team's score
        //         team1Score = `${inning1Score}/${inning1Wickets} (${Math.floor(inning1Balls / 6)}.${inning1Balls % 6})`;

        //         // Set the bowling team's score to "0/0"
        //         team2Score = '0/0 (0.0)';
        //     } else if (data.inning === 2) {
        //         // For inning 2, display the first team's final score and current score of team 2
        //         team1Score = `${inning1Score}/${inning1Wickets} (${Math.floor(inning1Balls / 6)}.${inning1Balls % 6})`;

        //         // Display the score for the second team's current batting status
        //         team2Score = data.totalRuns
        //             ? `${data.totalRuns}/${data.totalWickets} (${Math.floor(data.totalBalls / 6)}.${data.totalBalls % 6})`
        //             : '0/0 (0.0)';
        //     }
        // });

        const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/'

        let team1Score = '0/0 (0.0)';
        let team2Score = '0/0 (0.0)';
        let team1Name = '';
        let team1Logo = '';
        let team1Id = '';
        let team2Name = '';
        let team2Logo = '';
        let team2Id = '';
        let batting1Players = [];
        let bowling1Players = [];
        let batting2Players = [];
        let bowling2Players = [];

        // Variables for storing inning 1 score
        let inning1Score = 0;
        let inning1Wickets = 0;
        let inning1Balls = 0;

        // Iterate through scoreBoard data to fetch scores
        scoreBoard.forEach((data) => {
            // Assign team names and IDs
            if (!team1Name) team1Name = data.battingTeamDetails.short_name;
            if (!team1Logo) team1Logo = data.battingTeamDetails.logo;
            if (!team1Id) team1Id = data.battingTeamDetails._id;
            if (!team2Name) team2Name = data.ballingTeamDetails.short_name;
            if (!team2Logo) team2Logo = data.ballingTeamDetails.logo;
            if (!team2Id) team2Id = data.ballingTeamDetails._id;

            if (data.inning === 1) {
                // Inning 1: Batting for team 1, bowling for team 2
                inning1Score = data.totalRuns || 0;
                inning1Wickets = data.totalWickets || 0;
                inning1Balls = data.totalBalls || 0;

                team1Score = `${inning1Score}/${inning1Wickets} (${Math.floor(inning1Balls / 6)}.${inning1Balls % 6})`;

                // Add batting player details for inning 1
                batting1Players = data.batting.map(player => ({
                    playerName: player.playerDetails.player_name,
                    runs: player.runs,
                    four: player.fours,
                    six: player.sixes,
                    ballsFaced: player.balls,
                    strikeRate: player.strikeRate,
                    isOut: player.isOut,

                }));

                // Add bowling player details for inning 1 (team 2 bowling)
                bowling1Players = data.balling.map(bowler => ({
                    playerName: bowler.playerDetails.player_name,
                    // overs: Math.floor(bowler.balls / 6) + "." + (bowler.balls % 6),
                    overs: bowler.overs,
                    wickets: bowler.wickets,
                    runs: bowler.runs,
                    economy: bowler.economy,
                    maidenOvers: bowler.maidenOvers,
                }));

            } else if (data.inning === 2) {
                // Inning 2: Batting for team 2, bowling for team 1
                team1Score = `${inning1Score}/${inning1Wickets} (${Math.floor(inning1Balls / 6)}.${inning1Balls % 6})`;

                let inning2Score = data.totalRuns || 0;
                let inning2Wickets = data.totalWickets || 0;
                let inning2Balls = data.totalBalls || 0;

                team2Score = `${inning2Score}/${inning2Wickets} (${Math.floor(inning2Balls / 6)}.${inning2Balls % 6})`;

                // Add batting player details for inning 2
                batting2Players = data.batting.map(player => ({
                    playerName: player.playerDetails.player_name,
                    runs: player.runs,
                    ballsFaced: player.balls,
                    strikeRate: player.strikeRate,
                    four: player.fours,
                    six: player.sixes,
                    isOut: player.isOut
                }));

                // Add bowling player details for inning 2 (team 1 bowling)
                bowling2Players = data.balling.map(bowler => ({
                    playerName: bowler.playerDetails.player_name,
                    overs: Math.floor(bowler.balls / 6) + "." + (bowler.balls % 6),
                    wickets: bowler.wickets,
                    runs: bowler.runs,
                    economy: bowler.economy,
                    maidenOvers: bowler.maidenOvers,
                }));
            }
        });

        // Final response
        const response = {
            success: true,
            message: "Scoreboard fetched successfully",
            data: {
                team1: {
                    _id: team1Id,
                    name: team1Name || "Team 1",
                    logo: BASE_URL_TEAM + team1Logo || "",
                    score: team1Score,
                    batting1Players: batting1Players,
                    bowling1Players: bowling1Players,
                },
                team2: {
                    _id: team2Id,
                    name: team2Name || "Team ",
                    logo: BASE_URL_TEAM + team2Logo || "",
                    score: team2Score,
                    batting2Players: batting2Players,
                    bowling2Players: bowling2Players,
                },
            },
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


//create match score api
exports.createNewScoreBoard = async (req, res) => {
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
        const { inning, battingTeam, ballingTeam } = req.body;

        const scoreBoard = await ScoreBoard.create({
            matchId,
            inning: inning,
            battingTeam: ballingTeam, // Swapping teams after the match
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam: battingTeam,
            batting: [],
            balling: [],
        });
        return res.status(200).json({
            success: true,
            message: "Match is started",
            data: scoreBoard,
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

//create first superOver score api
exports.createNewSuperOverScoreBoard = async (req, res) => {
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
        const { inning, battingTeam, ballingTeam } = req.body;

        const scoreBoard = await ScoreBoard.create({
            matchId,
            inning: inning,
            battingTeam: ballingTeam, // Swapping teams after the match
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam: battingTeam,
            batting: [],
            balling: [],
        });

        const superOver_score = await SuperOver.create({
            matchId,
            status: "first",
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

        return res.status(200).json({
            success: true,
            message: "SuperOver is started",
            data: { superOver_score, scoreBoard },
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

//create first superOver Secoud Inning score api
exports.createNewSecoundInningSuperOverScoreBoard = async (req, res) => {
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
        const { inning, battingTeam, ballingTeam } = req.body;

        const scoreBoard = await ScoreBoard.create({
            matchId,
            inning: inning,
            battingTeam: battingTeam, // Swapping teams after the match
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam: ballingTeam,
            batting: [],
            balling: [],
        });

        return res.status(200).json({
            success: true,
            message: "Secound SuperOver is started",
            data: scoreBoard,
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

//create Second superOver score api
exports.createNewSecoundSuperOverScoreBoard = async (req, res) => {
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
        const { inning, battingTeam, ballingTeam } = req.body;


        const scoreBoard = await ScoreBoard.create({
            matchId,
            inning: inning,
            battingTeam: battingTeam, // Swapping teams after the match
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam: ballingTeam,
            batting: [],
            balling: [],
        });

        const secound_superOver_score = await SecoundSuperOver.create({
            matchId,
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

        return res.status(200).json({
            success: true,
            message: "SuperOver is started",
            data: { secound_superOver_score, scoreBoard },
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

//create Second superOver Secoud Inning score api
exports.createNewSecoundInningSecoundSuperOverScoreBoard = async (req, res) => {
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
        const { inning, battingTeam, ballingTeam } = req.body;

        const scoreBoard = await ScoreBoard.create({
            matchId,
            inning: inning,
            battingTeam: ballingTeam, // Swapping teams after the match
            extras: {
                nb: 0,
                wide: 0,
            },
            ballingTeam: battingTeam,
            batting: [],
            balling: [],
        });

        return res.status(200).json({
            success: true,
            message: "Secound SuperOver is started",
            data: scoreBoard,
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


exports.getLastScoreBoard = async (req, res) => {
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
        const scoreBoard = await ScoreBoard.findOne({ matchId: matchId }).sort({
            createdAt: -1,
        });
        return res.status(200).json({
            success: true,
            message: "Match is started",
            data: scoreBoard,
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
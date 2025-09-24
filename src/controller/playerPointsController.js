const Admin = require("../models/admin");
const joinContest = require("../models/joinContest");
const myTeamSchema = require("../models/my_team");
const PlayerPoint = require("../models/PlayerPoints");
const mongoose = require("mongoose");
const PointSystem = require("../models/PointSystem");
const Match = require("../models/match");
const League = require("../models/league");
const baseURL = "https://cricgem-harsh.onrender.com/playerPhoto/"

const getPlayerPointLeague = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        const { playerId, leagueId } = req.query;

        if (!playerId || !leagueId) {
            return res
                .status(400)
                .json({ message: "playerId and leagueId are required" });
        }

        const result = await PlayerPoint.aggregate([
            {
                $match: {
                    playerId: new mongoose.Types.ObjectId(playerId),
                    leagueId: new mongoose.Types.ObjectId(leagueId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalPoints: { $sum: "$points" },
                },
            },
        ]);

        if (result.length === 0) {
            return res
                .status(404)
                .json({
                    message: "Player points not found for the specified league",
                });
        }

        return res.status(200).json({
            success: true,
            message: "Player points retrieved successfully",
            totalPoints: result[0].totalPoints,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getPlayerPointForMatch = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        const { playerId, matchId } = req.query;

        if (!playerId || !matchId) {
            return res
                .status(400)
                .json({ message: "playerId and leagueId are required" });
        }

        const playerPoints = await PlayerPoint.findOne({
            playerId,
            matchId,
        }).select("points");

        if (!playerPoints) {
            return res
                .status(404)
                .json({
                    message:
                        "Player points not found for the specified match and league",
                });
        }

        return res.status(200).json({
            success: true,
            message: "Player points retrieved successfully",
            points: playerPoints.points,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getPlayerPointInMyTeam = async (req, res) => {
    try {
        // let adminId = req.user;

        // let admin = await Admin.findById(adminId);
        // if (!admin) {
        //     return res.status(404).json({
        //         success: false,
        //         message: 'Admin not found'
        //     });
        // }
        const { myteamId } = req.query;

        const data = await myTeamSchema.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(myteamId),
                },
            },
            {
                $lookup: {
                    from: "player_points",
                    localField: "players",
                    foreignField: "playerId",
                    as: "pointData",
                },
            },
            {
                $addFields: {
                    players: {
                        $map: {
                            input: "$players",
                            as: "player",
                            in: {
                                playerId: "$$player",
                                points: {
                                    $reduce: {
                                        input: {
                                            $filter: {
                                                input: "$pointData",
                                                as: "pd",
                                                cond: {
                                                    $eq: [
                                                        "$$pd.playerId",
                                                        "$$player",
                                                    ],
                                                },
                                            },
                                        },
                                        initialValue: 0,
                                        in: { $ifNull: ["$$this.points", 0] },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    playerPoints: "$players",
                    totalPoints: { $sum: "$players.points" },
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: "points retrieved successfully",
            data: data,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


async function getPointSystemsForMatch(matchId) {
    try {
        // Step 1: Find the match by its ID
        const match = await Match.findById(matchId);
        if (!match) {
            throw new Error("Match not found");
        }

        // Step 2: Get the league_id from the match
        const leagueId = match.league_id;

        // console.log("leagueId: ",leagueId);
        // Step 3: Find the league by its ID
        const league = await League.findById(leagueId);
        if (!league) {
            throw new Error("League not found");
        }

        // Step 4: Get the matchType from the league
        const matchType = league.matchType;

        // Step 5: Find all point systems related to the matchType
        const pointSystems = await PointSystem.aggregate([
            {
                $lookup: {
                    from: "point_types", // collection name in the database
                    localField: "pointType",
                    foreignField: "_id",
                    as: "pointTypeDetails",
                },
            },
            {
                $lookup: {
                    from: "point_fors", // collection name in the database
                    localField: "pointFor",
                    foreignField: "_id",
                    as: "pointForDetails",
                },
            },
            {
                $match: { matchType: new mongoose.Types.ObjectId(matchType) },
            },
            {
                $unwind: "$pointTypeDetails",
            },
            {
                $unwind: "$pointForDetails",
            },
            {
                $project: {
                    _id: 1,
                    points: 1,
                    pointType: "$pointTypeDetails.point_type_name",
                    pointFor: "$pointForDetails.point_for_name",
                    "status": "$pointForDetails.status"
                },
            },
        ]);
        return { pointSystems, leagueId };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getPlayerPointInMatchIdByUser = async (req, res) => {
    try {
        let userId = req.user;
        const { matchId } = req.query;

        const { pointSystems } = await getPointSystemsForMatch(matchId);

        // Step 2: Create a point map for easy access
        const pointMap = {};
        pointSystems.forEach(point => {
            pointMap[point.status] = point.points; // Map status to points
        });

        console.log(pointMap)

        const data = await joinContest.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "contest_id",
                    foreignField: "_id",
                    as: "contest_details",
                },
            },
            { $unwind: "$contest_details" },
            {
                $match: {
                    "contest_details.match_id": new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $lookup: {
                    from: "myteams",
                    localField: "myTeam_id",
                    foreignField: "_id",
                    as: "my_teams",
                },
            },
            { $unwind: "$my_teams" },
            {
                $lookup: {
                    from: "players",
                    localField: "my_teams.players",
                    foreignField: "_id",
                    as: "playerDetails",
                },
            },

            {
                $lookup: {
                    from: "scoreboards",
                    localField: "contest_details.match_id",
                    foreignField: "matchId",
                    as: "scoreboard",
                },
            },
            { $unwind: { path: "$scoreboard", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    playerPoints: {
                        $map: {
                            input: "$my_teams.players",
                            as: "player",
                            in: {
                                playerId: "$$player",
                                playerName: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$playerDetails",
                                                as: "pd",
                                                cond: { $eq: ["$$pd._id", "$$player"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                playerRole: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$playerDetails",
                                                as: "pd",
                                                cond: { $eq: ["$$pd._id", "$$player"] },
                                            },
                                        },
                                        0,
                                    ],
                                },

                                points: {
                                    // $add: [
                                    //     2, // Default points for every player
                                    //     {
                                    $let: {
                                        vars: {
                                            battingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting",
                                                            as: "batting",
                                                            cond: { $eq: ["$$batting.playerId", "$$player"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            bowlingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.balling",
                                                            as: "bowling",
                                                            cond: { $eq: ["$$bowling.playerId", "$$player"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            fieldingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.ballerId", "$$player"] },
                                                                    { $in: ["$$fielding.status", ["lbw", "bowled"]] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            catchOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                    { $eq: ["$$fielding.status", "catch"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            runOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noBallRunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            notDirectrunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            notDirectrunOutStats1: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noballnotDirectrunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noballnotDirectrunOutStats1: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            stumpingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "stumping",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$stumping.status", "stumping"] },
                                                                    { $eq: ["$$stumping.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $add: [
                                                {
                                                    // Add default points based on the inning
                                                    $cond: [
                                                        { $eq: ["$scoreboard.inning", 1] }, // Check if it's the first inning
                                                        2, // Default points for every player in the first inning
                                                        0 // No default points in the second inning
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$battingStats", false] },
                                                        {
                                                            $add: [
                                                                { $multiply: [{ $ifNull: ["$$battingStats.runs", 0] }, pointMap['run'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.sixes", 0] }, pointMap['six'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.fours", 0] }, pointMap['boundary'] || 0] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 30] }, // Check if runs are greater than or equal to 30
                                                                                { $lte: ["$$battingStats.runs", 49] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['thirty_run'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 50] }, // Check if runs are greater than or equal to 30
                                                                                { $lte: ["$$battingStats.runs", 99] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['half_century'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 100] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['century'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 120] },
                                                                                { $lte: ["$$battingStats.strikeRate", 140] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['120_to_140'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 140.01] },
                                                                                { $lte: ["$$battingStats.strikeRate", 160] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['140.1_to_160'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 160] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['160_up'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 60] },
                                                                                { $lt: ["$$battingStats.strikeRate", 70] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['60_to_70'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 50] },
                                                                                { $lt: ["$$battingStats.strikeRate", 59.9] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['50_to_59.9'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                // { $gte: ["$$battingStats.strikeRate", 5] },
                                                                                { $lte: ["$$battingStats.strikeRate", 50] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['50_down'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $eq: ["$$battingStats.runs", 0] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['duck'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$bowlingStats", false] },
                                                        {
                                                            $add: [
                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.wickets", 0] }, pointMap['wicket'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.maidenOvers", 0] }, pointMap['maiden_over'] || 0] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $eq: ["$$bowlingStats.wickets", 3] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['three_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $eq: ["$$bowlingStats.wickets", 4] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['four_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $gte: ["$$bowlingStats.wickets", 5] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['five_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss bowled
                                                                                { $lt: ["$$bowlingStats.economy", 4] } // Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['4_run_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 4] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 4.99] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        pointMap['4_to_4.99_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 5] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 6] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        pointMap['5_to_6_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 9] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 10] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        pointMap['9_to_10_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 10.01] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 11] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        pointMap['10.01_to_11_runs_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overs (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 11] } // Economy rate >= 11
                                                                            ]
                                                                        },
                                                                        pointMap['11_run_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        { $ifNull: ["$$fieldingStats", false] },
                                                                        5, // Points for fielding contribution
                                                                        0,
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$catchOutStats", false] },
                                                        pointMap['catch'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$runOutStats", false] },
                                                        pointMap['runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noBallRunOutStats", false] },
                                                        pointMap['runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$notDirectrunOutStats", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$notDirectrunOutStats1", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noballnotDirectrunOutStats", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noballnotDirectrunOutStats1", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$stumpingStats", false] },
                                                        pointMap['stumping'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                                captainViceCaptain: {
                                    $cond: [
                                        { $eq: ["$$player", "$my_teams.captain"] },
                                        "captain",
                                        {
                                            $cond: [
                                                { $eq: ["$$player", "$my_teams.vicecaptain"] },
                                                "vicecaptain",
                                                "player",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            { $unwind: "$playerPoints" },
            {
                $group: {
                    _id: {
                        teamId: "$my_teams._id",
                        playerId: "$playerPoints.playerId",
                    },
                    playerName: { $first: "$playerPoints.playerName.player_name" },
                    playerRole: { $first: "$playerPoints.playerRole.role" },
                    captainViceCaptain: { $first: "$playerPoints.captainViceCaptain" },
                    points: {
                        $sum: {
                            $add: [
                                {
                                    $cond: [
                                        { $eq: ["$playerPoints.captainViceCaptain", "captain"] },
                                        { $multiply: ["$playerPoints.points", 2] },
                                        {
                                            $cond: [
                                                { $eq: ["$playerPoints.captainViceCaptain", "vicecaptain"] },
                                                { $multiply: ["$playerPoints.points", 1.5] },
                                                "$playerPoints.points",
                                            ],
                                        },
                                    ],
                                },
                                // Bonus points for catches
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                3,
                                            ],
                                        },
                                        pointMap['three_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                4,
                                            ],
                                        },
                                        pointMap['four_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                5,
                                            ],
                                        },
                                        pointMap['five_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            {
                $sort: {
                    "playerName": 1, // Sort players by name (or use "_id" for unique sorting)
                },
            },
            {
                $group: {
                    _id: "$_id.teamId",
                    players: {
                        $push: {
                            playerId: "$_id.playerId",
                            playerName: "$playerName",
                            playerRole: "$playerRole",
                            captainViceCaptain: "$captainViceCaptain",
                            points: "$points",
                        },
                    },
                    totalPoints: { $sum: "$points" },
                },
            },
            {
                $project: {
                    teamId: "$_id",
                    players: 1,
                    totalPoints: "$totalPoints",
                },
            },
        ]);



        return res.status(200).json({
            success: true,
            message: "Points retrieved successfully",
            data: data
            // totalPoints: totalPoints
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.message });
    }
};



// const getPlayerPointInMatchIdByUser = async (req, res) => {
//     try {
//         let userId = req.user;
//         const { matchId } = req.query;

//         const { pointSystems } = await getPointSystemsForMatch(matchId);

//         // Step 2: Create a point map for easy access
//         const pointMap = {};
//         pointSystems.forEach(point => {
//             pointMap[point.status] = point.points; // Map status to points
//         });

//         console.log(pointMap);

//         const data = await joinContest.aggregate([
//             {
//                 $match: {
//                     user_id: new mongoose.Types.ObjectId(userId),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "contests",
//                     localField: "contest_id",
//                     foreignField: "_id",
//                     as: "contest_details",
//                 },
//             },
//             { $unwind: "$contest_details" },
//             {
//                 $match: {
//                     "contest_details.match_id": new mongoose.Types.ObjectId(matchId),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "myteams",
//                     localField: "myTeam_id",
//                     foreignField: "_id",
//                     as: "my_teams",
//                 },
//             },
//             { $unwind: "$my_teams" },
//             {
//                 $lookup: {
//                     from: "players",
//                     localField: "my_teams.players",
//                     foreignField: "_id",
//                     as: "playerDetails",
//                 },
//             },

//             {
//                 $lookup: {
//                     from: "scoreboards",
//                     localField: "contest_details.match_id",
//                     foreignField: "matchId",
//                     as: "scoreboard",
//                 },
//             },
//             { $unwind: { path: "$scoreboard", preserveNullAndEmptyArrays: true } },
//             {
//                 $addFields: {
//                     playerPoints: {
//                         $map: {
//                             input: "$my_teams.players",
//                             as: "player",
//                             in: {
//                                 playerId: "$$player",
//                                 playerName: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$playerDetails",
//                                                 as: "pd",
//                                                 cond: { $eq: ["$$pd._id", "$$player"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },
//                                 playerRole: {
//                                     $arrayElemAt: [
//                                         {
//                                             $filter: {
//                                                 input: "$playerDetails",
//                                                 as: "pd",
//                                                 cond: { $eq: ["$$pd._id", "$$player"] },
//                                             },
//                                         },
//                                         0,
//                                     ],
//                                 },

//                                 points: {
//                                     // $add: [
//                                     //     2, // Default points for every player
//                                     //     {
//                                     $let: {
//                                         vars: {
//                                             battingStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting",
//                                                             as: "batting",
//                                                             cond: { $eq: ["$$batting.playerId", "$$player"] },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             bowlingStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.balling",
//                                                             as: "bowling",
//                                                             cond: { $eq: ["$$bowling.playerId", "$$player"] },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             fieldingStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.ballerId", "$$player"] },
//                                                                     { $in: ["$$fielding.status", ["lbw", "bowled"]] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             catchOutStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
//                                                                     { $eq: ["$$fielding.status", "catch"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             runOutStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "runout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "direct"] },
//                                                                     { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             noBallRunOutStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "nbout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "direct"] },
//                                                                     { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             notDirectrunOutStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "runout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "not_direct"] },
//                                                                     { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             notDirectrunOutStats1: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "runout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "not_direct"] },
//                                                                     { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             noballnotDirectrunOutStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "nbout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "not_direct"] },
//                                                                     { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             noballnotDirectrunOutStats1: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "fielding",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$fielding.status", "nbout"] },
//                                                                     { $eq: ["$$fielding.runOutType", "not_direct"] },
//                                                                     { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                             stumpingStats: {
//                                                 $arrayElemAt: [
//                                                     {
//                                                         $filter: {
//                                                             input: "$scoreboard.batting.outBy",
//                                                             as: "stumping",
//                                                             cond: {
//                                                                 $and: [
//                                                                     { $eq: ["$$stumping.status", "stumping"] },
//                                                                     { $eq: ["$$stumping.secondaryPlayerId", "$$player"] },
//                                                                 ],
//                                                             },
//                                                         },
//                                                     },
//                                                     0,
//                                                 ],
//                                             },
//                                         },
//                                         in: {
//                                             $add: [
//                                                 {
//                                                     // Add default points based on the inning
//                                                     $cond: [
//                                                         { $eq: ["$scoreboard.inning", 1] }, // Check if it's the first inning
//                                                         2, // Default points for every player in the first inning
//                                                         0 // No default points in the second inning
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$battingStats", false] },
//                                                         {
//                                                             $add: [
//                                                                 { $multiply: [{ $ifNull: ["$$battingStats.runs", 0] }, 1] },
//                                                                 // { $cond: [{ $gte: ["$$battingStats.runs", 30] }, 2, 0] },
//                                                                 // { $cond: [{ $gte: ["$$battingStats.runs", 50] }, 6, 0] },
//                                                                 // { $cond: [{ $gte: ["$$battingStats.runs", 100] }, 14, 0] },
//                                                                 { $multiply: [{ $ifNull: ["$$battingStats.sixes", 0] }, 2] },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.runs", 30] },
//                                                                                 { $lte: ["$$battingStats.runs", 49] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         2, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.runs", 50] },
//                                                                                 { $lte: ["$$battingStats.runs", 99] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         6, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.runs", 100] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         14, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.strikeRate", 120] },
//                                                                                 { $lte: ["$$battingStats.strikeRate", 140] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         2, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.strikeRate", 140.01] },
//                                                                                 { $lte: ["$$battingStats.strikeRate", 160] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         4, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.strikeRate", 160] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         6, // Add 2 points if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.strikeRate", 60] },
//                                                                                 { $lt: ["$$battingStats.strikeRate", 70] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         -1, // Deduct 1 point if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$battingStats.strikeRate", 50] },
//                                                                                 { $lt: ["$$battingStats.strikeRate", 59.9] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         -2, // Deduct 1 point if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 // { $gte: ["$$battingStats.strikeRate", 5] },
//                                                                                 { $lte: ["$$battingStats.strikeRate", 50] },
//                                                                                 { $gte: ["$$battingStats.balls", 10] },
//                                                                                 { $eq: ["$$battingStats.isOut", true] }
//                                                                             ]
//                                                                         },
//                                                                         -3, // Deduct 1 point if criteria match
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         { $and: [{ $eq: ["$$battingStats.runs", 0] }, { $eq: ["$$battingStats.isOut", true] }] },
//                                                                         -2, // Deduct 2 points if runs are 0 and player is out
//                                                                         0,
//                                                                     ],
//                                                                 },
//                                                             ],
//                                                         },
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$bowlingStats", false] },
//                                                         {
//                                                             $add: [

//                                                                 { $multiply: [{ $ifNull: ["$$bowlingStats.wickets", 0] }, 25] },
//                                                                 // { $cond: [{ $gte: ["$$bowlingStats.wickets", 3] }, 4, 0] },
//                                                                 // { $cond: [{ $gte: ["$$bowlingStats.wickets", 4] }, 8, 0] },
//                                                                 // { $cond: [{ $gte: ["$$bowlingStats.wickets", 5] }, 14, 0] },
//                                                                 { $multiply: [{ $ifNull: ["$$bowlingStats.maidenOvers", 0] }, 10] },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
//                                                                                 { $eq: ["$$bowlingStats.wickets", 3] }// Economy rate < 4
//                                                                             ]
//                                                                         },
//                                                                         4, // Award 6 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
//                                                                                 { $eq: ["$$bowlingStats.wickets", 4] }// Economy rate < 4
//                                                                             ]
//                                                                         },
//                                                                         8, // Award 6 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
//                                                                                 { $gte: ["$$bowlingStats.wickets", 5] }// Economy rate < 4
//                                                                             ]
//                                                                         },
//                                                                         14, // Award 6 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss bowled
//                                                                                 { $lt: ["$$bowlingStats.economy", 4] } // Economy rate < 4
//                                                                             ]
//                                                                         },
//                                                                         6, // Award 6 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
//                                                                                 { $gte: ["$$bowlingStats.economy", 4] }, // Economy rate >= 4
//                                                                                 { $lte: ["$$bowlingStats.economy", 4.99] } // Economy rate <= 4.99
//                                                                             ]
//                                                                         },
//                                                                         4, // Award 4 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
//                                                                                 { $gte: ["$$bowlingStats.economy", 5] }, // Economy rate >= 4
//                                                                                 { $lte: ["$$bowlingStats.economy", 6] } // Economy rate <= 4.99
//                                                                             ]
//                                                                         },
//                                                                         2, // Award 4 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
//                                                                                 { $gte: ["$$bowlingStats.economy", 9] }, // Economy rate >= 9
//                                                                                 { $lt: ["$$bowlingStats.economy", 10] } // Economy rate < 10
//                                                                             ]
//                                                                         },
//                                                                         -2, // Deduct 2 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
//                                                                                 { $gte: ["$$bowlingStats.economy", 10.01] }, // Economy rate >= 9
//                                                                                 { $lt: ["$$bowlingStats.economy", 11] } // Economy rate < 10
//                                                                             ]
//                                                                         },
//                                                                         -4, // Deduct 2 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         {
//                                                                             $and: [
//                                                                                 { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overs (12 balls)
//                                                                                 { $gte: ["$$bowlingStats.economy", 11] } // Economy rate >= 11
//                                                                             ]
//                                                                         },
//                                                                         -6, // Deduct 6 points
//                                                                         0
//                                                                     ]
//                                                                 },
//                                                                 {
//                                                                     $cond: [
//                                                                         { $ifNull: ["$$fieldingStats", false] },
//                                                                         5, // Points for fielding contribution
//                                                                         0,
//                                                                     ],
//                                                                 },
//                                                             ],
//                                                         },
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$catchOutStats", false] },
//                                                         8, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$runOutStats", false] },
//                                                         10, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$noBallRunOutStats", false] },
//                                                         10, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$notDirectrunOutStats", false] },
//                                                         6, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$notDirectrunOutStats1", false] },
//                                                         6, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$noballnotDirectrunOutStats", false] },
//                                                         6, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$noballnotDirectrunOutStats1", false] },
//                                                         6, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 {
//                                                     $cond: [
//                                                         { $ifNull: ["$$stumpingStats", false] },
//                                                         10, // Points for a catch-out
//                                                         0,
//                                                     ],
//                                                 },
//                                                 // {
//                                                 //     $cond: [
//                                                 //         { $ifNull: ["$$notDirectRunOutStats", false] },
//                                                 //         {
//                                                 //             $add: [
//                                                 //                 {
//                                                 //                     $sum: [
//                                                 //                         {
//                                                 //                             $cond: [
//                                                 //                                 { $eq: ["$$player", "$$notDirectRunOutStats.secondaryPlayerId"] },
//                                                 //                                 6, // Points for secondary player
//                                                 //                                 0
//                                                 //                             ]
//                                                 //                         },
//                                                 //                         {
//                                                 //                             $cond: [
//                                                 //                                 { $eq: ["$$player", "$$notDirectRunOutStats.assistingPlayerId"] },
//                                                 //                                 6, // Points for assisting player
//                                                 //                                 0
//                                                 //                             ]
//                                                 //                         }
//                                                 //                     ]
//                                                 //                 }
//                                                 //             ]
//                                                 //         },
//                                                 //         0
//                                                 //     ]
//                                                 // },
//                                             ],
//                                         },
//                                     },
//                                     // },
//                                     // ],
//                                 },
//                                 captainViceCaptain: {
//                                     $cond: [
//                                         { $eq: ["$$player", "$my_teams.captain"] },
//                                         "captain",
//                                         {
//                                             $cond: [
//                                                 { $eq: ["$$player", "$my_teams.vicecaptain"] },
//                                                 "vicecaptain",
//                                                 "player",
//                                             ],
//                                         },
//                                     ],
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             { $unwind: "$playerPoints" },
//             {
//                 $group: {
//                     _id: {
//                         teamId: "$my_teams._id",
//                         playerId: "$playerPoints.playerId",
//                     },
//                     playerName: { $first: "$playerPoints.playerName.player_name" },
//                     playerRole: { $first: "$playerPoints.playerRole.role" },
//                     captainViceCaptain: { $first: "$playerPoints.captainViceCaptain" },
//                     points: {
//                         $sum: {
//                             $add: [
//                                 {
//                                     $cond: [
//                                         { $eq: ["$playerPoints.captainViceCaptain", "captain"] },
//                                         { $multiply: ["$playerPoints.points", 2] },
//                                         {
//                                             $cond: [
//                                                 { $eq: ["$playerPoints.captainViceCaptain", "vicecaptain"] },
//                                                 { $multiply: ["$playerPoints.points", 1.5] },
//                                                 "$playerPoints.points",
//                                             ],
//                                         },
//                                     ],
//                                 },
//                                 // Bonus points for catches
//                                 {
//                                     $cond: [
//                                         {
//                                             $eq: [
//                                                 {
//                                                     $size: {
//                                                         $ifNull: [
//                                                             {
//                                                                 $filter: {
//                                                                     input: "$scoreboard.batting.outBy",
//                                                                     as: "fielding",
//                                                                     cond: {
//                                                                         $and: [
//                                                                             { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
//                                                                             { $eq: ["$$fielding.status", "catch"] },
//                                                                         ],
//                                                                     },
//                                                                 },
//                                                             },
//                                                             [] // Provide an empty array if null
//                                                         ],
//                                                     },
//                                                 },
//                                                 3,
//                                             ],
//                                         },
//                                         4, // Bonus points for 3 catches
//                                         0,
//                                     ],
//                                 },
//                                 {
//                                     $cond: [
//                                         {
//                                             $eq: [
//                                                 {
//                                                     $size: {
//                                                         $ifNull: [
//                                                             {
//                                                                 $filter: {
//                                                                     input: "$scoreboard.batting.outBy",
//                                                                     as: "fielding",
//                                                                     cond: {
//                                                                         $and: [
//                                                                             { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
//                                                                             { $eq: ["$$fielding.status", "catch"] },
//                                                                         ],
//                                                                     },
//                                                                 },
//                                                             },
//                                                             [] // Provide an empty array if null
//                                                         ],
//                                                     },
//                                                 },
//                                                 4,
//                                             ],
//                                         },
//                                         6, // Bonus points for 4 catches
//                                         0,
//                                     ],
//                                 },
//                                 {
//                                     $cond: [
//                                         {
//                                             $eq: [
//                                                 {
//                                                     $size: {
//                                                         $ifNull: [
//                                                             {
//                                                                 $filter: {
//                                                                     input: "$scoreboard.batting.outBy",
//                                                                     as: "fielding",
//                                                                     cond: {
//                                                                         $and: [
//                                                                             { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
//                                                                             { $eq: ["$$fielding.status", "catch"] },
//                                                                         ],
//                                                                     },
//                                                                 },
//                                                             },
//                                                             [] // Provide an empty array if null
//                                                         ],
//                                                     },
//                                                 },
//                                                 5,
//                                             ],
//                                         },
//                                         8, // Bonus points for 5 catches
//                                         0,
//                                     ],
//                                 },
//                             ],
//                         },
//                     },
//                 },
//             },
//             {
//                 $sort: {
//                     "playerName": 1, // Sort players by name (or use "_id" for unique sorting)
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$_id.teamId",
//                     players: {
//                         $push: {
//                             playerId: "$_id.playerId",
//                             playerName: "$playerName",
//                             playerRole: "$playerRole",
//                             captainViceCaptain: "$captainViceCaptain",
//                             points: "$points",
//                         },
//                     },
//                     totalPoints: { $sum: "$points" },
//                 },
//             },
//             {
//                 $project: {
//                     teamId: "$_id",
//                     players: 1,
//                     totalPoints: "$totalPoints",
//                 },
//             },
//         ]);

//         // const totalPoints = data.reduce((acc, player) => acc + player.points, 0);

//         // const response = {
//         //     playerPoints: data,
//         //     totalPoints: totalPoints,
//         // };


//         return res.status(200).json({
//             success: true,
//             message: "Points retrieved successfully",
//             data: data
//             // totalPoints: totalPoints
//         });
//     } catch (error) {
//         console.error(error)
//         return res.status(500).json({ error: error.message });
//     }
// };


const getPlayerPointInTeamIdByUser = async (req, res) => {
    try {
        let userId = req.user;
        const { myteamId } = req.query;

        let myTeam = await myTeamSchema.findById(myteamId)

        const { pointSystems } = await getPointSystemsForMatch(myTeam.match_id);

        // Step 2: Create a point map for easy access
        const pointMap = {};
        pointSystems.forEach(point => {
            pointMap[point.status] = point.points; // Map status to points
        });

        const data = await joinContest.aggregate([
            {
                $match: {
                    // user_id: new mongoose.Types.ObjectId(userId),
                    myTeam_id: new mongoose.Types.ObjectId(myteamId),
                },
            },
            {
                $lookup: {
                    from: "myteams",
                    localField: "myTeam_id",
                    foreignField: "_id",
                    as: "my_teams",
                },
            },
            {
                $unwind: "$my_teams",
            },
            {
                $lookup: {
                    from: "players",  // Lookup for player details (player_name, role)
                    localField: "my_teams.players",
                    foreignField: "_id",
                    as: "playerDetails",
                },
            },
            {
                $sort: { "playerDetails._id": 1 } // Sort players by their unique `_id` (or another consistent field like `player_name`)
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "contest_id",
                    foreignField: "_id",
                    as: "contest_details",
                },
            },
            { $unwind: "$contest_details" },
            {
                $lookup: {
                    from: "scoreboards",
                    localField: "contest_details.match_id",
                    foreignField: "matchId",
                    as: "scoreboard",
                },
            },
            { $unwind: { path: "$scoreboard", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    playerPoints: {
                        $map: {
                            input: "$my_teams.players",
                            as: "player",
                            in: {
                                playerId: "$$player",
                                playerName: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$playerDetails",
                                                as: "pd",
                                                cond: { $eq: ["$$pd._id", "$$player"] },
                                            },
                                        },
                                        0,
                                    ],
                                },
                                playerRole: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$playerDetails",
                                                as: "pd",
                                                cond: { $eq: ["$$pd._id", "$$player"] },
                                            },
                                        },
                                        0,
                                    ],
                                },

                                points: {
                                    // $add: [
                                    //     2, // Default points for every player
                                    //     {
                                    $let: {
                                        vars: {
                                            battingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting",
                                                            as: "batting",
                                                            cond: { $eq: ["$$batting.playerId", "$$player"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            bowlingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.balling",
                                                            as: "bowling",
                                                            cond: { $eq: ["$$bowling.playerId", "$$player"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            fieldingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.ballerId", "$$player"] },
                                                                    { $in: ["$$fielding.status", ["lbw", "bowled"]] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            catchOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                    { $eq: ["$$fielding.status", "catch"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            runOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noBallRunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            notDirectrunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            notDirectrunOutStats1: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "runout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noballnotDirectrunOutStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            noballnotDirectrunOutStats1: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "fielding",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$fielding.status", "nbout"] },
                                                                    { $eq: ["$$fielding.runOutType", "not_direct"] },
                                                                    { $eq: ["$$fielding.assistingPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            stumpingStats: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$scoreboard.batting.outBy",
                                                            as: "stumping",
                                                            cond: {
                                                                $and: [
                                                                    { $eq: ["$$stumping.status", "stumping"] },
                                                                    { $eq: ["$$stumping.secondaryPlayerId", "$$player"] },
                                                                ],
                                                            },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: {
                                            $add: [
                                                {
                                                    // Add default points based on the inning
                                                    $cond: [
                                                        { $eq: ["$scoreboard.inning", 1] }, // Check if it's the first inning
                                                        2, // Default points for every player in the first inning
                                                        0 // No default points in the second inning
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$battingStats", false] },
                                                        {
                                                            $add: [
                                                                { $multiply: [{ $ifNull: ["$$battingStats.runs", 0] }, pointMap['run'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.sixes", 0] }, pointMap['six'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.fours", 0] }, pointMap['boundary'] || 0] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 30] }, // Check if runs are greater than or equal to 30
                                                                                { $lte: ["$$battingStats.runs", 49] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['thirty_run'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 50] }, // Check if runs are greater than or equal to 30
                                                                                { $lte: ["$$battingStats.runs", 99] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['half_century'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 100] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['century'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 120] },
                                                                                { $lte: ["$$battingStats.strikeRate", 140] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['120_to_140'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 140.01] },
                                                                                { $lte: ["$$battingStats.strikeRate", 160] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['140.1_to_160'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 160] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['160_up'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 60] },
                                                                                { $lt: ["$$battingStats.strikeRate", 70] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['60_to_70'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.strikeRate", 50] },
                                                                                { $lt: ["$$battingStats.strikeRate", 59.9] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['50_to_59.9'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                // { $gte: ["$$battingStats.strikeRate", 5] },
                                                                                { $lte: ["$$battingStats.strikeRate", 50] },
                                                                                { $gte: ["$$battingStats.balls", 10] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['50_down'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $eq: ["$$battingStats.runs", 0] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        pointMap['duck'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$bowlingStats", false] },
                                                        {
                                                            $add: [
                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.wickets", 0] }, pointMap['wicket'] || 0] },
                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.maidenOvers", 0] }, pointMap['maiden_over'] || 0] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $eq: ["$$bowlingStats.wickets", 3] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['three_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $eq: ["$$bowlingStats.wickets", 4] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['four_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $gte: ["$$bowlingStats.wickets", 5] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['five_wicket'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss bowled
                                                                                { $lt: ["$$bowlingStats.economy", 4] } // Economy rate < 4
                                                                            ]
                                                                        },
                                                                        pointMap['4_run_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 4] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 4.99] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        pointMap['4_to_4.99_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 5] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 6] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        pointMap['5_to_6_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 9] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 10] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        pointMap['9_to_10_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 10.01] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 11] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        pointMap['10.01_to_11_runs_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "2.0"] }, // Minimum 2 overs (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 11] } // Economy rate >= 11
                                                                            ]
                                                                        },
                                                                        pointMap['11_run_per_over'] || 0, // Points for 30 Run Bonus
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        { $ifNull: ["$$fieldingStats", false] },
                                                                        5, // Points for fielding contribution
                                                                        0,
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$catchOutStats", false] },
                                                        pointMap['catch'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$runOutStats", false] },
                                                        pointMap['runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noBallRunOutStats", false] },
                                                        pointMap['runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$notDirectrunOutStats", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$notDirectrunOutStats1", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noballnotDirectrunOutStats", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$noballnotDirectrunOutStats1", false] },
                                                        pointMap['not_direct_runout'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$stumpingStats", false] },
                                                        pointMap['stumping'] || 0, // Points for Catch
                                                        0,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                                captainViceCaptain: {
                                    $cond: [
                                        { $eq: ["$$player", "$my_teams.captain"] },
                                        "captain",
                                        {
                                            $cond: [
                                                { $eq: ["$$player", "$my_teams.vicecaptain"] },
                                                "vicecaptain",
                                                "player",
                                            ],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            { $unwind: "$playerPoints" },
            {
                $group: {
                    _id: {
                        teamId: "$my_teams._id",
                        playerId: "$playerPoints.playerId",
                    },
                    playerName: { $first: "$playerPoints.playerName.player_name" },
                    playerRole: { $first: "$playerPoints.playerRole.role" },
                    captainViceCaptain: { $first: "$playerPoints.captainViceCaptain" },
                    points: {
                        $sum: {
                            $add: [
                                {
                                    $cond: [
                                        { $eq: ["$playerPoints.captainViceCaptain", "captain"] },
                                        { $multiply: ["$playerPoints.points", 2] },
                                        {
                                            $cond: [
                                                { $eq: ["$playerPoints.captainViceCaptain", "vicecaptain"] },
                                                { $multiply: ["$playerPoints.points", 1.5] },
                                                "$playerPoints.points",
                                            ],
                                        },
                                    ],
                                },
                                // Bonus points for catches
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                3,
                                            ],
                                        },
                                        pointMap['three_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                4,
                                            ],
                                        },
                                        pointMap['four_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                                {
                                    $cond: [
                                        {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $ifNull: [
                                                            {
                                                                $filter: {
                                                                    input: "$scoreboard.batting.outBy",
                                                                    as: "fielding",
                                                                    cond: {
                                                                        $and: [
                                                                            { $eq: ["$$fielding.secondaryPlayerId", "$playerPoints.playerId"] },
                                                                            { $eq: ["$$fielding.status", "catch"] },
                                                                        ],
                                                                    },
                                                                },
                                                            },
                                                            [] // Provide an empty array if null
                                                        ],
                                                    },
                                                },
                                                5,
                                            ],
                                        },
                                        pointMap['five_catch'] || 0, // Points for Catch
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            {
                $sort: {
                    "playerName": 1, // Sort players by name (or use "_id" for unique sorting)
                },
            },
            {
                $group: {
                    _id: "$_id.teamId",
                    players: {
                        $push: {
                            playerId: "$_id.playerId",
                            playerName: "$playerName",
                            playerRole: "$playerRole",
                            captainViceCaptain: "$captainViceCaptain",
                            points: "$points",
                        },
                    },
                    totalPoints: { $sum: "$points" },
                },
            },
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(myteamId), // Filter to only include the specified team
                },
            },
            {
                $project: {
                    teamId: "$_id",
                    players: 1,
                    totalPoints: "$totalPoints",
                },
            },
        ]);

        // const totalPoints = data.reduce((acc, player) => acc + player.points, 0);

        // const response = {
        //     playerPoints: data,
        //     totalPoints: totalPoints,
        // };


        return res.status(200).json({
            success: true,
            message: "points retrieved successfully",
            data: data,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


const playerPoint = async (req, res) => {
    try {
        const { matchId } = req.query;

        const data = await PlayerPoint.aggregate([
            {
                $match: {
                    matchId: new mongoose.Types.ObjectId(matchId),
                },
            },
            {
                $group: {
                    _id: {
                        playerId: "$playerId",
                        matchId: "$matchId"
                    },
                    totalPoints: { $sum: "$points" }, // Summing up points for each player
                },
            },
            {
                $lookup: {
                    from: 'players',
                    localField: '_id.playerId',  // Use playerId from the grouped _id
                    foreignField: '_id',
                    as: 'player_details'
                }
            },
            {
                $unwind: "$player_details" // Unwind the array to get object fields
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: '_id.matchId', // Use matchId from the grouped _id
                    foreignField: '_id',
                    as: 'match_details'
                }
            },
            {
                $unwind: "$match_details" // Unwind the array to get object fields
            },
            {
                $lookup: {
                    from: 'teamplayers',
                    localField: '_id.playerId', // Match playerId in teamPlayer collection
                    foreignField: 'player_id',
                    as: 'teamplayer_details'
                }
            },
            {
                $unwind: "$teamplayer_details" // Unwind the array to get object fields
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'teamplayer_details.team_id', // Match team_id in teams collection
                    foreignField: '_id',
                    as: 'team_details'
                }
            },
            {
                $unwind: "$team_details" // Unwind the array to get object fields
            },
            {
                $project: {
                    _id: 0,
                    playerId: "$_id.playerId",
                    playerName: "$player_details.player_name",
                    playerRole: "$player_details.role",
                    playerPhoto: { $concat: [baseURL, "$player_details.player_photo"] },
                    teamShortName: "$team_details.short_name", // Add team short name
                    totalPoints: 1, // Include totalPoints from the group stage
                }
            },
            {
                $group: {
                    _id: { playerId: "$playerId" },
                    playerName: { $first: "$playerName" },
                    playerRole: { $first: "$playerRole" },
                    playerPhoto: { $first: "$playerPhoto" },
                    teamShortName: { $first: "$teamShortName" },
                    totalPoints: { $first: "$totalPoints" },
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Points retrieved successfully",
            data: data,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};




module.exports = {
    getPlayerPointLeague,
    getPlayerPointForMatch,
    getPlayerPointInMyTeam,
    playerPoint,
    getPlayerPointInMatchIdByUser,
    getPlayerPointInTeamIdByUser
};

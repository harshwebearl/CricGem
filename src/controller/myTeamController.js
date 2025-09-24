const mongoose = require("mongoose");
const Myteam = require("../models/my_team");
const User = require("../models/user");
const my_team = require("../models/my_team");
const admin = require("../models/admin");
const notification = require("../models/notification");
const Match = require("../models/match")
const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/'
const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/'


exports.createMyteam = async (req, res) => {

    try {
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        // Extract data from the request body
        const { match_id, players, captain, vicecaptain } = req.body;

        // Create a new team object
        const newTeam = new Myteam({
            match_id,
            user_id: userId,
            players,
            captain,
            vicecaptain
        });

        // Save the team to the database
        const savedTeam = await newTeam.save();

        let matchdetails = await Match.findOne({ _id: match_id })

        const notificationData = await notification.create({
            user_id: userId,
            match_id: match_id,
            title: "Team Created",
            message: `You have successfully created a team for the ${matchdetails.match_name}.`,
        })

        // Respond with success message and the created team data
        res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: savedTeam
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.updateTeam = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        let { myTeamId } = req.query

        let userData = await Myteam.findOne({ user_id: userId })
        if (!userData) {
            return res.status(401).json({
                success: false,
                message: "User Not Found"
            })
        }

        const { players, captain, vicecaptain } = req.body;

        let updateData = {
            players,
            captain,
            vicecaptain
        }

        let updateMyTeam = await Myteam.findByIdAndUpdate(myTeamId, updateData, { new: true });
        res.status(200).json({
            success: true,
            message: "Team updated successfully",
            data: updateMyTeam
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
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        let teamList = await Myteam.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match"
                }
            },
            {
                $unwind: "$match"
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "match.league_id",
                    foreignField: "_id",
                    as: "league"
                }
            },
            {
                $unwind: "$league"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_1_id",
                    foreignField: "_id",
                    as: "team1"
                }
            },
            {
                $unwind: "$team1"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_2_id",
                    foreignField: "_id",
                    as: "team2"
                }
            },
            {
                $unwind: "$team2"
            },
            {
                $lookup: {
                    from: "players",
                    localField: "players",
                    foreignField: "_id",
                    as: "players"
                }
            },
            {
                $unwind: "$players"
            },
            {
                $lookup: {
                    from: "teamplayers", // Assuming the collection name for team-player mapping
                    localField: "match.team_1_id",
                    foreignField: "team_id",
                    as: "team1Players"
                }
            },
            {
                $lookup: {
                    from: "teamplayers",
                    localField: "match.team_2_id",
                    foreignField: "team_id",
                    as: "team2Players"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    captain: { $first: "$captain" },
                    vicecaptain: { $first: "$vicecaptain" },
                    match: { $first: "$match" },
                    user_details: { $first: "$user_details" },
                    league: { $first: "$league" },
                    team1: { $first: "$team1" },
                    team2: { $first: "$team2" },
                    team1Players: { $first: "$team1Players" },
                    team2Players: { $first: "$team2Players" },
                    players: {
                        $push: {
                            _id: "$players._id",
                            player_name: "$players.player_name",
                            player_photo: "$players.player_photo",
                            nationality: "$players.nationality",
                            role: "$players.role",
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    captain: 1,
                    vicecaptain: 1,
                    "user_details.name": 1,
                    "user_details.unique_id": 1,
                    "match._id": 1,
                    "match.time": 1,
                    "match.city": 1,
                    "match.state": 1,
                    "match.country": 1,
                    "league.league_name": 1,
                    "team1.team_name": 1,
                    "team1.logo": 1,
                    "team1.other_photo": 1,
                    "team1.short_name": 1,
                    "team2.team_name": 1,
                    "team2.logo": 1,
                    "team2.other_photo": 1,
                    "team2.short_name": 1,
                    players: 1,
                    team1Players: 1,
                    team2Players: 1,
                }
            }
        ]);

        if (!teamList || teamList.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team not found"
            });
        }

        let team1ShortName = teamList[0]?.team1?.short_name || "Unknown";
        let team2ShortName = teamList[0]?.team2?.short_name || "Unknown";

        // Safely retrieve player IDs for team1 and team2
        let team1PlayerIds = teamList[0]?.team1Players?.map(player => player.player_id.toString()) || [];
        let team2PlayerIds = teamList[0]?.team2Players?.map(player => player.player_id.toString()) || [];


        // Find players' team short names and group them
        let playersTeam1 = [];
        let playersTeam2 = [];
        let myTeamPlayers = [];
        let otherTeamPlayers = [];

        teamList[0].players.forEach(player => {
            player.player_photo = BASE_URL_PLAYER + player.player_photo;

            if (team1PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team1ShortName;
                playersTeam1.push(player);
            } else if (team2PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team2ShortName;
                playersTeam2.push(player);
            } else {
                player.team_short_name = "N/A"; // Handle edge cases if needed
            }
        });

        // Add URLs to team logos and other photos
        teamList[0].team1.logo = BASE_URL_TEAM + teamList[0].team1.logo;
        teamList[0].team1.other_photo = BASE_URL_TEAM + teamList[0].team1.other_photo;
        teamList[0].team2.logo = BASE_URL_TEAM + teamList[0].team2.logo;
        teamList[0].team2.other_photo = BASE_URL_TEAM + teamList[0].team2.other_photo;

        return res.status(200).json({
            success: true,
            message: "Team List with match and player information",
            data: {
                ...teamList[0],
                team1ShortName: team1ShortName,
                team2ShortName: team2ShortName,
                team1PlayerCount: playersTeam1.length,
                team2PlayerCount: playersTeam2.length
            }// Assuming you only have one team with the given ID
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.displayDetail = async (req, res) => {
    try {
        let userId = req.user
        let user = await admin.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        let { myTeamId } = req.query
        let teamDetails = await Myteam.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(myTeamId),
                    // user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match"
                }
            },
            {
                $unwind: {
                    path: "$match",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "match.league_id",
                    foreignField: "_id",
                    as: "league"
                }
            },
            {
                $unwind: {
                    path: "$league",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_1_id",
                    foreignField: "_id",
                    as: "team1"
                }
            },
            {
                $unwind: {
                    path: "$team1",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_2_id",
                    foreignField: "_id",
                    as: "team2"
                }
            },
            {
                $unwind: {
                    path: "$team2",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "players",
                    localField: "players",
                    foreignField: "_id",
                    as: "players"
                }
            },
            {
                $unwind: {
                    path: "$players",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "players",
                    localField: "captain",
                    foreignField: "_id",
                    as: "captain_details"
                }
            },
            {
                $unwind: {
                    path: "$captain_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "players",
                    localField: "vicecaptain",
                    foreignField: "_id",
                    as: "vicecaptain_details"
                }
            },
            {
                $unwind: {
                    path: "$vicecaptain_details",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "teamplayers", // Assuming the collection name for team-player mapping
                    localField: "match.team_1_id",
                    foreignField: "team_id",
                    as: "team1Players"
                }
            },
            {
                $lookup: {
                    from: "teamplayers",
                    localField: "match.team_2_id",
                    foreignField: "team_id",
                    as: "team2Players"
                }
            },
            {
                $group: {
                    _id: "$_id",
                    captain: { $first: "$captain" },
                    vicecaptain: { $first: "$vicecaptain" },
                    user_details: { $first: "$user_details" },
                    match: { $first: "$match" },
                    league: { $first: "$league" },
                    team1: { $first: "$team1" },
                    team2: { $first: "$team2" },
                    team1Players: { $first: "$team1Players" },
                    team2Players: { $first: "$team2Players" },
                    captain_details: { $first: "$captain_details" },
                    vicecaptain_details: { $first: "$vicecaptain_details" },
                    players: {
                        $push: {
                            _id: "$players._id",
                            player_name: "$players.player_name",
                            player_photo: "$players.player_photo",
                            nationality: "$players.nationality",
                            role: "$players.role",
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    captain: 1,
                    vicecaptain: 1,
                    "user_details.name": 1,
                    "user_details.unique_id": 1,
                    "match._id": 1,
                    "match.time": 1,
                    "match.city": 1,
                    "match.state": 1,
                    "match.country": 1,
                    "league.league_name": 1,
                    "team1.team_name": 1,
                    "team1.logo": 1,
                    "team1.other_photo": 1,
                    "team1.short_name": 1,
                    "team2.team_name": 1,
                    "team2.logo": 1,
                    "team2.other_photo": 1,
                    "team2.short_name": 1,
                    players: 1,
                    team1Players: 1,
                    team2Players: 1,
                    captain_details: 1,
                    vicecaptain_details: 1,
                }
            }
        ]);

        if (!teamDetails || teamDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team And User not found"
            });
        }

        // Determine short names for team 1 and team 2
        let team1ShortName = teamDetails[0]?.team1?.short_name || "Unknown";
        let team2ShortName = teamDetails[0]?.team2?.short_name || "Unknown";

        // Safely retrieve player IDs for team1 and team2
        let team1PlayerIds = teamDetails[0]?.team1Players?.map(player => player.player_id.toString()) || [];
        let team2PlayerIds = teamDetails[0]?.team2Players?.map(player => player.player_id.toString()) || [];


        // Find players' team short names and group them
        let playersTeam1 = [];
        let playersTeam2 = [];
        let myTeamPlayers = [];
        let otherTeamPlayers = [];

        teamDetails[0].players.forEach(player => {
            player.player_photo = BASE_URL_PLAYER + player.player_photo;

            if (team1PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team1ShortName;
                playersTeam1.push(player);
            } else if (team2PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team2ShortName;
                playersTeam2.push(player);
            } else {
                player.team_short_name = "N/A"; // Handle edge cases if needed
            }
        });

        // Add URLs to team logos and other photos
        teamDetails[0].team1.logo = BASE_URL_TEAM + teamDetails[0].team1.logo;
        teamDetails[0].team1.other_photo = BASE_URL_TEAM + teamDetails[0].team1.other_photo;
        teamDetails[0].team2.logo = BASE_URL_TEAM + teamDetails[0].team2.logo;
        teamDetails[0].team2.other_photo = BASE_URL_TEAM + teamDetails[0].team2.other_photo;


        teamDetails[0].captain_details.player_photo = BASE_URL_PLAYER + teamDetails[0].captain_details.player_photo;
        teamDetails[0].vicecaptain_details.player_photo = BASE_URL_PLAYER + teamDetails[0].vicecaptain_details.player_photo;

        return res.status(200).json({
            success: true,
            message: "Team details with league, team 1, and team 2 information",
            data: {
                ...teamDetails[0],
                team1ShortName: team1ShortName,
                team2ShortName: team2ShortName,
                team1PlayerCount: playersTeam1.length,
                team2PlayerCount: playersTeam2.length
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}




exports.displayDetails = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        let { myTeamId } = req.query;

        let teamDetails = await Myteam.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(myTeamId),
                    // user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details"
                }
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match"
                }
            },
            {
                $unwind: "$match"
            },
            {
                $lookup: {
                    from: "leagues",
                    localField: "match.league_id",
                    foreignField: "_id",
                    as: "league"
                }
            },
            {
                $unwind: "$league"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_1_id",
                    foreignField: "_id",
                    as: "team1"
                }
            },
            {
                $unwind: "$team1"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_2_id",
                    foreignField: "_id",
                    as: "team2"
                }
            },
            {
                $unwind: "$team2"
            },
            {
                $lookup: {
                    from: "players",
                    localField: "players",
                    foreignField: "_id",
                    as: "players"
                }
            },
            {
                $unwind: "$players"
            },
            {
                $lookup: {
                    from: "teamplayers", // Assuming the collection name for team-player mapping
                    localField: "match.team_1_id",
                    foreignField: "team_id",
                    as: "team1Players"
                }
            },
            {
                $lookup: {
                    from: "teamplayers",
                    localField: "match.team_2_id",
                    foreignField: "team_id",
                    as: "team2Players"
                }
            },
            {
                $sort: { "players._id": 1 } // Sort players by their unique `_id` (or another consistent field like `player_name`)
            },
            {
                $group: {
                    _id: "$_id",
                    captain: { $first: "$captain" },
                    vicecaptain: { $first: "$vicecaptain" },
                    user_details: { $first: "$user_details" },
                    match: { $first: "$match" },
                    league: { $first: "$league" },
                    team1: { $first: "$team1" },
                    team2: { $first: "$team2" },
                    team1Players: { $first: "$team1Players" },
                    team2Players: { $first: "$team2Players" },
                    players: {
                        $push: {
                            _id: "$players._id",
                            player_name: "$players.player_name",
                            player_photo: "$players.player_photo",
                            nationality: "$players.nationality",
                            role: "$players.role",
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    captain: 1,
                    vicecaptain: 1,
                    "user_details.name": 1,
                    "user_details.unique_id": 1,
                    "match._id": 1,
                    "match.time": 1,
                    "match.city": 1,
                    "match.state": 1,
                    "match.country": 1,
                    "league.league_name": 1,
                    "team1.team_name": 1,
                    "team1.logo": 1,
                    "team1.other_photo": 1,
                    "team1.short_name": 1,
                    "team2.team_name": 1,
                    "team2.logo": 1,
                    "team2.other_photo": 1,
                    "team2.short_name": 1,
                    players: 1,
                    team1Players: 1,
                    team2Players: 1,
                }
            }
        ]);

        if (!teamDetails || teamDetails.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Team And User not found"
            });
        }

        // Determine short names for team 1 and team 2
        let team1ShortName = teamDetails[0]?.team1?.short_name || "Unknown";
        let team2ShortName = teamDetails[0]?.team2?.short_name || "Unknown";

        // Safely retrieve player IDs for team1 and team2
        let team1PlayerIds = teamDetails[0]?.team1Players?.map(player => player.player_id.toString()) || [];
        let team2PlayerIds = teamDetails[0]?.team2Players?.map(player => player.player_id.toString()) || [];


        // Find players' team short names and group them
        let playersTeam1 = [];
        let playersTeam2 = [];
        let myTeamPlayers = [];
        let otherTeamPlayers = [];

        teamDetails[0].players.forEach(player => {
            player.player_photo = BASE_URL_PLAYER + player.player_photo;

            if (team1PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team1ShortName;
                playersTeam1.push(player);
            } else if (team2PlayerIds.includes(player._id.toString())) {
                player.team_short_name = team2ShortName;
                playersTeam2.push(player);
            } else {
                player.team_short_name = "N/A"; // Handle edge cases if needed
            }
        });

        // Add URLs to team logos and other photos
        teamDetails[0].team1.logo = BASE_URL_TEAM + teamDetails[0].team1.logo;
        teamDetails[0].team1.other_photo = BASE_URL_TEAM + teamDetails[0].team1.other_photo;
        teamDetails[0].team2.logo = BASE_URL_TEAM + teamDetails[0].team2.logo;
        teamDetails[0].team2.other_photo = BASE_URL_TEAM + teamDetails[0].team2.other_photo;

        return res.status(200).json({
            success: true,
            message: "Team details with league, team 1, and team 2 information",
            data: {
                ...teamDetails[0],
                team1ShortName: team1ShortName,
                team2ShortName: team2ShortName,
                team1PlayerCount: playersTeam1.length,
                team2PlayerCount: playersTeam2.length
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.displayListByMatchId = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        const { matchId } = req.query;

        const myTeamList = await my_team.aggregate([
            {
                $match: {
                    match_id: new mongoose.Types.ObjectId(matchId),
                    user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'captain',
                    foreignField: '_id',
                    as: 'captain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'vicecaptain',
                    foreignField: '_id',
                    as: 'vicecaptain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'players',
                    foreignField: '_id',
                    as: "player_details"
                }
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match"
                }
            },
            {
                $unwind: "$match"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_1_id",
                    foreignField: "_id",
                    as: "team1"
                }
            },
            {
                $unwind: "$team1"
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match.team_2_id",
                    foreignField: "_id",
                    as: "team2"
                }
            },
            {
                $unwind: "$team2"
            },
            {
                $unwind: {
                    path: '$player_details',
                    preserveNullAndEmptyArrays: true

                }

            },
            {
                $addFields: {
                    points: 100
                }
            },
            {
                $group: {
                    _id: '$_id',
                    captain_details: { $first: '$captain_details' },
                    vicecaptain_details: { $first: '$vicecaptain_details' },
                    match_date: { $first: '$match.date' },
                    match_time: { $first: '$match.time' },
                    team1_logo: { $first: { $concat: [BASE_URL_TEAM, "$team1.logo"] } },
                    team2_logo: { $first: { $concat: [BASE_URL_TEAM, "$team2.logo"] } },
                    batsman: {
                        $sum: { $cond: [{ $eq: ['$player_details.role', 'Batsman'] }, 1, 0] }
                    },
                    allrounder: {
                        $sum: { $cond: [{ $eq: ['$player_details.role', 'All Rounder'] }, 1, 0] }
                    },
                    wicketkeeper: {
                        $sum: { $cond: [{ $eq: ['$player_details.role', 'Wicket Keeper'] }, 1, 0] }
                    },
                    bowler: {
                        $sum: { $cond: [{ $eq: ['$player_details.role', 'Bowler'] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    captain: { $arrayElemAt: ['$captain_details', 0] },
                    vicecaptain: { $arrayElemAt: ['$vicecaptain_details', 0] },
                    match_date: 1,
                    match_time: 1,
                    team1_logo: 1,
                    team2_logo: 1,
                    batsman: 1,
                    allrounder: 1,
                    wicketkeeper: 1,
                    bowler: 1,
                    points: 1
                }
            }
        ]);

        myTeamList.sort((a, b) => {
            return a._id.toString().localeCompare(b._id.toString()); // Sorting by _id in ascending order
        });

        myTeamList.forEach((team, index) => {
            team.team_label = `(T${index + 1})`;
            if (team.captain && team.captain.player_photo) {
                team.captain.player_photo = BASE_URL_PLAYER + team.captain.player_photo;
            }
            if (team.vicecaptain && team.vicecaptain.player_photo) {
                team.vicecaptain.player_photo = BASE_URL_PLAYER + team.vicecaptain.player_photo;
            }
        });

        return res.status(200).json({
            success: true,
            message: "My Team",
            data: myTeamList // Assuming you only have one team with the given ID
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.deleteMyTeam = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        const { myteamId } = req.query;

        const teamDeleted = await my_team.findByIdAndDelete(myteamId);

        return res.status(200).json({
            success: true,
            message: "Team Deleted Succesfully",
            data: teamDeleted // Assuming you only have one team with the given ID
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayAllTeams = async (req, res) => {
    let userId = req.user
    let user = await User.findById(userId);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User Not Found!"
        });
    }
    const { contestId } = req.query;

    const allTeams = await my_team.find();
    return res.status(200).json({
        success: true,
        message: "all Team find Succesfully",
        data: allTeams // Assuming you only have one team with the given ID
    });
}

// exports.displayAllListByMatchId = async (req, res) => {
//     try {
//         let userId = req.user
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!"
//             });
//         }

//         let { matchId } = req.query

//         let allTeamDetails = await Myteam.aggregate([
//             {
//                 $match: {
//                     match_id: new mongoose.Types.ObjectId(matchId),
//                     user_id: new mongoose.Types.ObjectId(userId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'players',
//                     localField: 'captain',
//                     foreignField: '_id',
//                     as: 'captain_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'players',
//                     localField: 'vicecaptain',
//                     foreignField: '_id',
//                     as: 'vicecaptain_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'players',
//                     localField: 'players',
//                     foreignField: '_id',
//                     as: "player_details"
//                 }
//             },

//             {
//                 $unwind: '$player_details'
//             },
//             {
//                 $addFields: {
//                     points: 100
//                 }
//             },
//             {
//                 $group: {
//                     _id: '$_id',
//                     captain_details: { $first: '$captain_details' },
//                     vicecaptain_details: { $first: '$vicecaptain_details' },
//                     batsman: {
//                         $sum: { $cond: [{ $eq: ['$player_details.role', 'Batsman'] }, 1, 0] }
//                     },
//                     allrounder: {
//                         $sum: { $cond: [{ $eq: ['$player_details.role', 'Allrounder'] }, 1, 0] }
//                     },
//                     wicketkeeper: {
//                         $sum: { $cond: [{ $eq: ['$player_details.role', 'Wicket Keeper'] }, 1, 0] }
//                     },
//                     bowler: {
//                         $sum: { $cond: [{ $eq: ['$player_details.role', 'Bowler'] }, 1, 0] }
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     captain: { $arrayElemAt: ['$captain_details', 0] },
//                     vicecaptain: { $arrayElemAt: ['$vicecaptain_details', 0] },
//                     batsman: 1,
//                     allrounder: 1,
//                     wicketkeeper: 1,
//                     bowler: 1,
//                     points: 1
//                 }
//             }
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Display All Team Find Successfully",
//             data: allTeamDetails
//         })
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
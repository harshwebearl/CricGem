const mongoose = require("mongoose");
const Player = require("../models/player");
const Admin = require("../models/admin");
// const BASE_URL = 'https://batting-api-1.onrender.com/playerPhoto'
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const match = require("../models/match");
const User = require("../models/user");



exports.createPlayer = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { player_name, age, nationality, birth_date, role, bat_type, bowl_type } = req.body
        let playerData = new Player({
            player_name,
            player_photo: req.file.filename,
            age,
            nationality,
            birth_date,
            role,
            bat_type,
            bowl_type,
        });
        let result = await playerData.save();
        res.status(200).json({
            success: true,
            message: "Player Add Successfully",
            data: result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

exports.playerDisplayList = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let playerData = await Player.find();

        if (playerData && playerData.length > 0) {
            // Define the base URL for player photos
            const playerBaseUrl = "https://batting-api-1.onrender.com/playerPhoto/";

            // Add base URL to each player's photo
            playerData.forEach(player => {
                if (player.player_photo) {
                    player.player_photo = playerBaseUrl + player.player_photo;
                }
            });
        }
        if (playerData) {
            res.status(200).json({
                success: true,
                message: "Player Find Successfully",
                data: playerData
            })
        } else {
            res.status(200).json({
                success: true,
                message: "Player Not Found!"
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}



// exports.displayDetails = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         let { playerId } = req.query
//         let playerData = await Player.findById(playerId)

//         if (playerData) {
//             // Define the base URL for player photos
//             const playerBaseUrl = "https://batting-api-1.onrender.com/playerPhoto/";

//             // Add base URL to the player's photo
//             if (playerData.player_photo) {
//                 playerData.player_photo = playerBaseUrl + playerData.player_photo;
//             }
//         }
//         if (playerData) {
//             res.status(200).json({
//                 success: true,
//                 message: "Player Find Successfully",
//                 data: playerData
//             })
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "Player Not Found!"
//             })
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// }


exports.displayDetails = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { playerId } = req.query;

        // Aggregation pipeline
        const playerData = await Player.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(playerId) }
            },
            {
                $lookup: {
                    from: 'teamplayers', // Collection name for TeamPlayer
                    localField: '_id',
                    foreignField: 'player_id',
                    as: 'team_history'
                }
            },
            {
                $unwind: {
                    path: '$team_history',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'teams', // Collection name for Team
                    localField: 'team_history.team_id',
                    foreignField: '_id',
                    as: 'team_details'
                }
            },
            {
                $unwind: {
                    path: '$team_details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'leagues', // Collection name for League
                    localField: 'team_details.league_id',
                    foreignField: '_id',
                    as: 'league_details'
                }
            },
            {
                $unwind: {
                    path: '$league_details',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$_id',
                    player_name: { $first: '$player_name' }, // Replace 'name' with the actual field
                    player_photo: { $first: '$player_photo' },
                    age: { $first: '$age' },
                    nationality: { $first: '$nationality' },
                    birth_date: { $first: '$birth_date' },
                    role: { $first: '$role' },
                    bat_type: { $first: '$bat_type' },
                    bowl_type: { $first: '$bowl_type' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                    team_history: {
                        $push: {
                            teamName: '$team_details.team_name',
                            leagueName: '$league_details.league_name'
                        }
                    }
                }
            }
        ]);

        if (!playerData || playerData.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Player Not Found!"
            });
        }

        // Add base URL to the player's photo
        const playerBaseUrl = "https://batting-api-1.onrender.com/playerPhoto/";
        if (playerData[0].player_photo) {
            playerData[0].player_photo = playerBaseUrl + playerData[0].player_photo;
        }

        res.status(200).json({
            success: true,
            message: "Player Found Successfully",
            data: playerData[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.editPlayer = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { playerId } = req.query;
        if (!playerId) {
            return res.status(401).json({
                success: false,
                message: "Player Id Not Found!"
            });
        }

        let { player_name, age, nationality, birth_date, role, bat_type, bowl_type } = req.body;

        let updateData = {
            player_name,
            age,
            nationality,
            birth_date,
            role,
            bat_type,
            bowl_type
        };

        // Check if a player photo is being uploaded
        if (req.file && req.file.filename) {
            const player_photo = req.file.filename; // Assuming 'player_photo' is the field name for the player photo file
            updateData.player_photo = req.file.filename; // Assuming 'player_photo' is the field name for storing the player photo path
        }

        let updatePlayerData = await Player.findByIdAndUpdate(playerId, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Player Data Updated Successfully",
            data: updatePlayerData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.selectPlayersDetails = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        const { matchId } = req.query;

        const playersDetails = await match.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(matchId) }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_1_id',
                    foreignField: '_id',
                    as: 'team1Details'
                }
            },
            {
                $unwind: '$team1Details'
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'team_2_id',
                    foreignField: '_id',
                    as: 'team2Details'
                }
            },
            {
                $unwind: '$team2Details'
            },
            {
                $lookup: {
                    from: 'teamplayers',
                    let: { team1: "$team_1_id", team2: "$team_2_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        { $eq: ["$team_id", "$$team1"] },
                                        { $eq: ["$team_id", "$$team2"] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'players',
                                localField: 'player_id',
                                foreignField: '_id',
                                as: 'playerInfo'
                            }
                        },
                        {
                            $unwind: '$playerInfo'
                        },
                        {
                            $lookup: {
                                from: 'teams',
                                localField: 'team_id',
                                foreignField: '_id',
                                as: 'teamInfo'
                            }
                        },
                        {
                            $unwind: '$teamInfo'
                        },
                        {
                            $lookup: {
                                from: 'player_points',
                                let: { playerId: "$player_id" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ["$playerId", "$$playerId"] }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$playerId",
                                            totalPoints: { $sum: "$points" }
                                        }
                                    }
                                ],
                                as: 'pointsInfo'
                            }
                        },
                        {
                            $unwind: {
                                path: "$pointsInfo",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $group: {
                                _id: "$playerInfo.role",
                                players: {
                                    $push: {
                                        _id: "$playerInfo._id",
                                        player_name: "$playerInfo.player_name",
                                        player_photo: {
                                            $concat: [
                                                "https://batting-api-1.onrender.com/playerPhoto/",
                                                "$playerInfo.player_photo"
                                            ]
                                        },
                                        age: "$playerInfo.age",
                                        nationality: "$playerInfo.nationality",
                                        birth_date: "$playerInfo.birth_date",
                                        bat_type: "$playerInfo.bat_type",
                                        bowl_type: "$playerInfo.bowl_type",
                                        status: "$status",
                                        team_id: "$team_id",
                                        team_name: "$teamInfo.team_name",
                                        team_short_name: "$teamInfo.short_name",  // Add the short name here
                                        totalPoints: { $ifNull: ["$pointsInfo.totalPoints", 0] },
                                        credit: (0).toFixed(1)
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                role: "$_id",
                                players: 1
                            }
                        }
                    ],
                    as: 'classifiedPlayers'
                }
            },
            {
                $project: {
                    _id: 1,
                    match_name: 1,
                    date: 1,
                    time: 1,
                    vanue: 1,
                    city: 1,
                    state: 1,
                    country: 1,
                    team1Details: {
                        _id: "$team1Details._id",
                        team_name: "$team1Details.team_name",
                        team_logo: {
                            $concat: [
                                "https://batting-api-1.onrender.com/teamPhoto/",
                                "$team1Details.logo"
                            ]
                        },
                        team_short_name: "$team1Details.short_name"
                    },
                    team2Details: {
                        _id: "$team2Details._id",
                        team_name: "$team2Details.team_name",
                        team_logo: {
                            $concat: [
                                "https://batting-api-1.onrender.com/teamPhoto/",
                                "$team2Details.logo"
                            ]
                        },
                        team_short_name: "$team2Details.short_name"
                    },
                    classifiedPlayers: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Player Data Updated Successfully",
            data: playersDetails
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};




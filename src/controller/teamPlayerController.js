const mongoose = require("mongoose");
const TeamPlayer = require("../models/team_player");
const Admin = require("../models/admin");
const Team = require("../models/team");
const BASE_URL_TEAM = 'https://cricgem-harsh.onrender.com/teamPhoto/'
const BASE_URL_PLAYER = 'https://cricgem-harsh.onrender.com/playerPhoto/'

exports.createTeamPlayer = async (req, res) => {
    try {
        let adminId = req.user;

        // Checking if the admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let { team_id, player_id, status, c_or_vc } = req.body;

        if (c_or_vc === "captain") {
            let exitsData = await Team.findOne({ vice_captain: player_id });
            if (exitsData) {
                return res.status(400).json({
                    success: false,
                    message: "Player Already Vice Captain",
                });
            }

            let updateCaptain = await Team.findByIdAndUpdate(
                team_id,
                { $set: { captain: player_id } },
                { new: true }
            );

            return res.status(200).json({
                success: true,
                message: "Player Captain Updated Successfully",
                data: updateCaptain,
            });
        } else if (c_or_vc === "vice_captain") {
            let exitsCaptainData = await Team.findOne({ captain: player_id });
            if (exitsCaptainData) {
                return res.status(400).json({
                    success: false,
                    message: "Player Already Captain",
                });
            }
            let updateVcCaptain = await Team.findByIdAndUpdate(
                team_id,
                { $set: { vice_captain: player_id } },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                message: "Player Vice Captain Updated Successfully",
                data: updateVcCaptain,
            });
        } else {
            let existsPlayer = await TeamPlayer.findOne({ team_id, player_id });
            if (existsPlayer) {
                return res.status(400).json({
                    success: false,
                    message: "Player already exists in a team",
                });
            } else {
                // Creating a new team player association
                let teamPlayerData = new TeamPlayer({
                    team_id,
                    player_id,
                    status,
                });
                let result = await teamPlayerData.save();
                return res.status(200).json({
                    success: true,
                    message: "Team Player added successfully",
                    data: result,
                });
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.insertTeamPlayer = async (req, res) => {
    try {
        const adminId = req.user;

        // Checking if the admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const datas = req.body;

        // Using for...of instead of forEach to handle async/await properly
        for (const data of datas) {
            const { team_id, players, captain, vice_captain } = data;

            // Delete existing team players for the given team_id
            await TeamPlayer.deleteMany({ team_id });

            const ele = [];

            // Add new team players
            for (const player of players) {
                ele.push(await TeamPlayer.create({ team_id, player_id: player }));
            }

            if (captain && captain.length > 0) {
                ele.push(await TeamPlayer.create({ team_id, player_id: captain, c_or_vc: "captain" }));
                await Team.findByIdAndUpdate(
                    team_id,
                    { $set: { captain } },
                    { new: true }
                );
            }

            if (vice_captain && vice_captain.length > 0) {
                ele.push(await TeamPlayer.create({ team_id, player_id: vice_captain, c_or_vc: "vice_captain" }));
                await Team.findByIdAndUpdate(
                    team_id,
                    { $set: { vice_captain } },
                    { new: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Team Player added successfully",
            data: "Success",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


// exports.insertTeamPlayer = async (req, res) => {
//     try {
//         const adminId = req.user;

//         // Checking if the admin exists
//         const admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Admin not found",
//             });
//         }

//         const datas = req.body;

//         // Using for...of instead of forEach to handle async/await properly
//         for (const data of datas) {
//             const { team_id, players, captain, vice_captain } = data;

//             // Delete existing team players for the given team_id
//             await TeamPlayer.deleteMany({ team_id });

//             const ele = [];

//             // Check if players exist in other teams and update their team_id
//             for (const player of players) {
//                 const existingPlayer = await TeamPlayer.findOne({ player_id: player });
//                 if (existingPlayer && existingPlayer.team_id.toString() !== team_id) {
//                     // Update team_id for the player
//                     await TeamPlayer.findOneAndUpdate(
//                         { player_id: player },
//                         { team_id },
//                         { new: true }
//                     );
//                 } else {
//                     // Add the player to the new team
//                     ele.push(await TeamPlayer.create({ team_id, player_id: player }));
//                 }
//             }

//             if (captain && captain.length > 0) {
//                 // Handle captain updates
//                 const existingCaptain = await TeamPlayer.findOne({ player_id: captain });
//                 if (existingCaptain && existingCaptain.team_id.toString() !== team_id) {
//                     await TeamPlayer.findOneAndUpdate(
//                         { player_id: captain },
//                         { team_id, c_or_vc: "captain" },
//                         { new: true }
//                     );
//                 } else {
//                     ele.push(await TeamPlayer.create({ team_id, player_id: captain, c_or_vc: "captain" }));
//                 }

//                 await Team.findByIdAndUpdate(
//                     team_id,
//                     { $set: { captain } },
//                     { new: true }
//                 );
//             }

//             if (vice_captain && vice_captain.length > 0) {
//                 // Handle vice-captain updates
//                 const existingViceCaptain = await TeamPlayer.findOne({ player_id: vice_captain });
//                 if (existingViceCaptain && existingViceCaptain.team_id.toString() !== team_id) {
//                     await TeamPlayer.findOneAndUpdate(
//                         { player_id: vice_captain },
//                         { team_id, c_or_vc: "vice_captain" },
//                         { new: true }
//                     );
//                 } else {
//                     ele.push(await TeamPlayer.create({ team_id, player_id: vice_captain, c_or_vc: "vice_captain" }));
//                 }

//                 await Team.findByIdAndUpdate(
//                     team_id,
//                     { $set: { vice_captain } },
//                     { new: true }
//                 );
//             }
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Team Player added successfully",
//             data: "Success",
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };


exports.displayList = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let displayData = await TeamPlayer.aggregate([
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "_id",
                    as: "team",
                },
            },
            // {
            //     $unwind: '$team'
            // },
            {
                $lookup: {
                    from: "players",
                    localField: "player_id",
                    foreignField: "_id",
                    as: "player",
                },
            },
            // {
            //     $unwind: '$player'
            // },
            {
                $lookup: {
                    from: "players",
                    localField: "team.captain",
                    foreignField: "_id",
                    as: "captain",
                },
            },
            // {
            //     $unwind: '$captain'
            // },
            {
                $lookup: {
                    from: "players",
                    localField: "team.vice_captain",
                    foreignField: "_id",
                    as: "vice_captain",
                },
            },
            // {
            //     $unwind: '$vice_captain'
            // },
            {
                $project: {
                    status: 1,
                    team: 1,
                    player: 1,
                    captain: 1,
                    vice_captain: 1,
                },
            },
        ]);

        displayData = displayData.map(item => {
            // Update team logo and other photos
            item.team[0].logo = `${BASE_URL_TEAM}${item.team[0].logo}`;
            item.team[0].other_photo = `${BASE_URL_TEAM}${item.team[0].other_photo}`;

            // Update player photo
            item.player[0].player_photo = `${BASE_URL_PLAYER}${item.player[0].player_photo}`;

            // Update captain and vice-captain photos
            item.captain[0].player_photo = `${BASE_URL_PLAYER}${item.captain[0].player_photo}`;
            item.vice_captain[0].player_photo = `${BASE_URL_PLAYER}${item.vice_captain[0].player_photo}`;

            return item;
        });

        return res.status(200).json({
            success: true,
            message: "Displaying Team, Player, Captain, and Vice-Captain Data",
            data: displayData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.displayListByTeamId = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        const team_id = req.params.id;
        let displayData = await TeamPlayer.aggregate([
            {
                $match: {
                    team_id: new mongoose.Types.ObjectId(team_id),
                },
            },
            // {
            //     $lookup: {
            //         from: "teams",
            //         localField: "team_id",
            //         foreignField: "_id",
            //         as: "team",
            //     },
            // },
            // {
            //     $unwind: '$team'
            // },
            {
                $lookup: {
                    from: "players",
                    localField: "player_id",
                    foreignField: "_id",
                    as: "player",
                },
            },
            // {
            //     $unwind: '$player'
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team.captain",
            //         foreignField: "_id",
            //         as: "captain",
            //     },
            // },
            // {
            //     $unwind: '$captain'
            // },
            // {
            //     $lookup: {
            //         from: "players",
            //         localField: "team.vice_captain",
            //         foreignField: "_id",
            //         as: "vice_captain",
            //     },
            // },
            // {
            //     $unwind: '$vice_captain'
            // },
            // {
            //     $project: {
            //         status: 1,
            //         team: 1,
            //         player: 1,
            //         captain: 1,
            //         vice_captain: 1,
            //     },
            // },
        ]);

        displayData = displayData.map(item => {

            item.player[0].player_photo = `${BASE_URL_PLAYER}${item.player[0].player_photo}`;

            return item;
        });

        return res.status(200).json({
            success: true,
            message: "Displaying Team, Player, Captain, and Vice-Captain Data",
            data: displayData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.editTeamPlayer = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let { teamPlayerId } = req.query;
        if (!teamPlayerId) {
            return res.status(401).json({
                success: false,
                message: "TeamPlayer Not Found!",
            });
        }
        let { team_id, player_id, status } = req.body;

        let updateData = {
            team_id,
            player_id,
            status,
        };
        let updateTeamData = await TeamPlayer.findByIdAndUpdate(
            teamPlayerId,
            updateData,
            { new: true }
        );
        res.status(200).json({
            success: true,
            message: "TeamPlayer Update Successfully",
            data: updateTeamData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.displayDetails = async (req, res) => {
    try {
        let adminId = req.user;
        let { teamPlayerId } = req.query;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let displayDetails = await TeamPlayer.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(teamPlayerId) },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "_id",
                    as: "team",
                },
            },
            {
                $unwind: {
                    path: "$team",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "player_id",
                    foreignField: "_id",
                    as: "player",
                },
            },
            {
                $unwind: "$player",
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team.captain",
                    foreignField: "_id",
                    as: "captain",
                },
            },
            {
                $unwind: {
                    path: "$captain",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "team.vice_captain",
                    foreignField: "_id",
                    as: "vice_captain",
                },
            },
            {
                $unwind: {
                    path: "$vice_captain",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    status: 1,
                    team: 1,
                    player: 1,
                    captain: 1,
                    vice_captain: 1,
                },
            },
        ]);

        displayDetails = displayDetails.map(item => {
            // Update team logo and other photos
            item.team.logo = `${BASE_URL_TEAM}${item.team.logo}`;
            item.team.other_photo = `${BASE_URL_TEAM}${item.team.other_photo}`;

            // Update player photo
            item.player.player_photo = `${BASE_URL_PLAYER}${item.player.player_photo}`;

            // Update captain and vice-captain photos
            item.captain.player_photo = `${BASE_URL_PLAYER}${item.captain.player_photo}`;
            item.vice_captain.player_photo = `${BASE_URL_PLAYER}${item.vice_captain.player_photo}`;

            return item;
        });

        return res.status(200).json({
            success: true,
            message: "Displaying Team, Player, Captain, and Vice-Captain Data",
            data: displayDetails,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.removePlayerId = async (req, res) => {
    try {
        let adminId = req.user;
        let { playerId } = req.query;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let existsViceCaptainData = await Team.findOne({
            vice_captain: playerId,
        });
        if (existsViceCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete player data by vice captain",
            });
        }

        let existsCaptainData = await Team.findOne({ captain: playerId });
        if (existsCaptainData) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete player data by captain",
            });
        }

        // Delete the player data
        let deletePlayerData = await TeamPlayer.deleteOne({
            player_id: playerId,
        });

        // Check if the player data was found and deleted
        if (deletePlayerData.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Team player not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Player deleted successfully",
            data: deletePlayerData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.teamIdByAllPlayerDisplay = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let { team_id } = req.query;

        let displayAllPlayerData = await TeamPlayer.aggregate([
            {
                $match: { team_id: new mongoose.Types.ObjectId(team_id) },
            },
            {
                $lookup: {
                    from: "players",
                    localField: "player_id",
                    foreignField: "_id",
                    as: "playersData",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "team_id",
                    foreignField: "_id",
                    as: "teamData",
                },
            },
            // {
            //     $unwind: '$teamData'
            // },
            {
                $unwind: {
                    path: "$teamData",
                    preserveNullAndEmptyArrays: true, // Agar katalog null ho ya khaali ho to bhi preserve karein
                },
            },
            // {
            //     $unwind: '$playersData'
            // },
            {
                $unwind: {
                    path: "$playersData",
                    preserveNullAndEmptyArrays: true, // Agar katalog null ho ya khaali ho to bhi preserve karein
                },
            },
            {
                $group: {
                    _id: "$team_id",
                    teamData: { $first: "$teamData" },
                    playersData: { $push: "$playersData" },
                },
            },
        ]);

        displayAllPlayerData = displayAllPlayerData.map(item => {
            // Update team logo and other photos
            item.teamData.logo = `${BASE_URL_TEAM}${item.teamData.logo}`;
            item.teamData.other_photo = `${BASE_URL_TEAM}${item.teamData.other_photo}`;

            // Update player photos
            item.playersData = item.playersData.map(player => {
                player.player_photo = `${BASE_URL_PLAYER}${player.player_photo}`;
                return player;
            });

            return item;
        });


        res.status(200).json({
            success: true,
            message: "All players of the team retrieved successfully",
            data: displayAllPlayerData,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

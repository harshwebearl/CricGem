const mongoose = require("mongoose");
const ContestDetails = require("../models/contest_detail");
const Admin = require("../models/admin");
const BASE_URL_TEAM = 'https://batting-api-1.onrender.com/teamPhoto/'
const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/'





// exports.createContestDetails = async (req, res) => {
//     try {
//         let adminId = req.user;

//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         let { contest_id, rankes } = req.body

//         let newData = new ContestDetails({
//             contest_id,
//             rankes
//         });
//         let result = await newData.save();
//         res.status(200).json({
//             success: true,
//             message: "Contest Details Create Successfully",
//             data: result
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }

exports.createContestDetails = async (req, res) => {
    try {
        let adminId = req.user;

        // Check if admin exists
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { contest_id, rankes } = req.body;

        // Validate rankes
        if (!rankes || !Array.isArray(rankes)) {
            return res.status(400).json({
                success: false,
                message: 'Rankes must be an array'
            });
        }

        let result;

        if (Array.isArray(contest_id)) {
            // Insert for multiple contest IDs
            const contestDetailsArray = contest_id.map(id => ({
                contest_id: id,
                rankes
            }));

            result = await ContestDetails.insertMany(contestDetailsArray);

            return res.status(200).json({
                success: true,
                message: 'Multiple Contest Details created successfully',
                data: result
            });

        } else if (contest_id) {
            // Insert single contest detail
            const newData = new ContestDetails({
                contest_id,
                rankes
            });

            result = await newData.save();

            return res.status(200).json({
                success: true,
                message: 'Contest Detail created successfully',
                data: result
            });

        } else {
            return res.status(400).json({
                success: false,
                message: 'contest_id is required'
            });
        }

    } catch (error) {
        console.error('Error creating contest details:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};



exports.updateContestDetails = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { contestDetailsId } = req.query

        let { contest_id, rankes } = req.body

        let updateData = {
            contest_id,
            rankes
        }

        let contestDetailsUpdateData = await ContestDetails.findByIdAndUpdate(contestDetailsId, updateData, { new: true })

        if (!contestDetailsUpdateData) {
            return res.status(401).json({
                success: false,
                message: "ContestDetails Not Found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Contest-Details Updated Successfully",
            data: contestDetailsUpdateData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.displayContestList = async (req, res) => {
    try {

        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let displayList = await ContestDetails.aggregate([
            {
                $lookup: {
                    from: 'contests',
                    localField: 'contest_id',
                    foreignField: '_id',
                    as: 'contest_details'
                }
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: 'contest_details.match_id',
                    foreignField: '_id',
                    as: 'match_details'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest_details.contest_type_id',
                    foreignField: '_id',
                    as: 'contest_types_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_1_id',
                    foreignField: '_id',
                    as: 'teams_1_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_1_details.captain',
                    foreignField: '_id',
                    as: 'team_1_captain_captain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_1_details.vice_captain',
                    foreignField: '_id',
                    as: 'team_1_captain_viceCaptain_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_2_id',
                    foreignField: '_id',
                    as: 'teams_2_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_2_details.captain',
                    foreignField: '_id',
                    as: 'team_2_captain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_2_details.vice_captain',
                    foreignField: '_id',
                    as: 'team_2_captain_viceCaptain_details'
                }
            },
            {
                $lookup: {
                    from: 'leagues',
                    localField: 'match_details.league_id',
                    foreignField: '_id',
                    as: 'leagues_details'
                }
            },

        ]);

        displayList.forEach(contest => {
            contest.teams_1_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team_1_captain_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.team_1_captain_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.teams_2_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team_2_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.team_2_captain_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
        })

        res.status(200).json({
            success: true,
            message: "Contest Details Find Successfully",
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

exports.displayContestDetails = async (req, res) => {
    try {

        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { contestDetailsId } = req.query

        let displayList = await ContestDetails.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(contestDetailsId) }
            },
            {
                $lookup: {
                    from: 'contests',
                    localField: 'contest_id',
                    foreignField: '_id',
                    as: 'contest_details'
                }
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: 'contest_details.match_id',
                    foreignField: '_id',
                    as: 'match_details'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest_details.contest_type_id',
                    foreignField: '_id',
                    as: 'contest_types_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_1_id',
                    foreignField: '_id',
                    as: 'teams_1_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_1_details.captain',
                    foreignField: '_id',
                    as: 'team_1_captain_captain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_1_details.vice_captain',
                    foreignField: '_id',
                    as: 'team_1_captain_viceCaptain_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_2_id',
                    foreignField: '_id',
                    as: 'teams_2_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_2_details.captain',
                    foreignField: '_id',
                    as: 'team_2_captain_details'
                }
            },
            {
                $lookup: {
                    from: 'players',
                    localField: 'teams_2_details.vice_captain',
                    foreignField: '_id',
                    as: 'team_2_captain_viceCaptain_details'
                }
            },
            {
                $lookup: {
                    from: 'leagues',
                    localField: 'match_details.league_id',
                    foreignField: '_id',
                    as: 'leagues_details'
                }
            },

        ]);

        displayList.forEach(contest => {
            contest.teams_1_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team_1_captain_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.team_1_captain_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.teams_2_details.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team_2_captain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
            contest.team_2_captain_viceCaptain_details.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
        })

        res.status(200).json({
            success: true,
            message: "Contest Details Find Successfully",
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

exports.deleteContestDisplayDetails = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { contestDetailsId } = req.query

        let deleteData = await ContestDetails.findByIdAndDelete(contestDetailsId)

        if (!deleteData) {
            return res.status(401).json({
                success: false,
                message: "ContestDetails Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "ContestDetails Delete Successfully",
            data: deleteData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

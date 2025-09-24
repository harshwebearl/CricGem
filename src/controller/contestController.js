const mongoose = require("mongoose");
const Contest = require("../models/contest");
const Admin = require("../models/admin");
const User = require("../models/user");
const contest = require("../models/contest");
const contest_detail = require("../models/contest_detail");
const joinContest = require("../models/joinContest");
const Match = require("../models/match");
const League = require("../models/league");
const PointSystem = require("../models/PointSystem");
const BASE_URL_TEAM = 'https://cricgem-harsh.onrender.com/teamPhoto/'
const BASE_URL_PROFILE = 'https://cricgem-harsh.onrender.com/userImage/'





// exports.createContest = async (req, res) => {
//     try {
//         let adminId = req.user;

//         // Checking if the admin exists
//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         let { match_id, contest_type_id, price_pool, entry_fees, total_participant, max_team_per_user, profit } = req.body
//         let newContest = new Contest({
//             match_id,
//             contest_type_id,
//             price_pool,
//             entry_fees,
//             total_participant,
//             max_team_per_user,
//             profit
//         });
//         let result = await newContest.save();
//         res.status(200).json({
//             success: true,
//             message: "Contest Add Successfully",
//             data: result
//         })
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }


// exports.createContest = async (req, res) => {
//     try {
//         let adminId = req.user; // Extract role from token (assumes middleware sets req.role)

//         // Checking if the admin exists
//         let admin = await Admin.findById(adminId);

//         if (admin.role !== 'admin' && admin.role !== 'superadmin') {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         // Destructure request body
//         let { match_id, contest_type_id, price_pool, entry_fees, total_participant, max_team_per_user, profit } = req.body;

//         // Set status based on role
//         let status = admin.role === 'superadmin' ? 'active' : 'inactive';

//         // Create new contest
//         let newContest = new Contest({
//             match_id,
//             contest_type_id,
//             price_pool,
//             entry_fees,
//             total_participant,
//             max_team_per_user,
//             profit,
//             status // Set status dynamically
//         });

//         // Save contest to database
//         let result = await newContest.save();

//         // Send response
//         res.status(200).json({
//             success: true,
//             message: "Contest Added Successfully",
//             data: result
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// };

exports.createContest = async (req, res) => {
    try {
        let adminId = req.user;

        // Check admin
        let admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin')) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        // Extract fields
        let { match_id, contest_type_id, price_pool, entry_fees, total_participant, max_team_per_user, profit } = req.body;

        // Validate base fields
        if (!contest_type_id || !price_pool || !entry_fees || !total_participant || !max_team_per_user) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Determine contest status
        let status = admin.role === 'superadmin' ? 'active' : 'inactive';

        let contests = [];

        if (Array.isArray(match_id)) {
            // Multiple match_ids
            contests = match_id.map(id => ({
                match_id: id,
                contest_type_id,
                price_pool,
                entry_fees,
                total_participant,
                max_team_per_user,
                profit,
                status
            }));

            const result = await Contest.insertMany(contests);

            return res.status(200).json({
                success: true,
                message: "Multiple contests created successfully",
                data: result
            });

        } else if (match_id) {
            // Single match_id
            const newContest = new Contest({
                match_id,
                contest_type_id,
                price_pool,
                entry_fees,
                total_participant,
                max_team_per_user,
                profit,
                status
            });

            const result = await newContest.save();

            return res.status(200).json({
                success: true,
                message: "Contest created successfully",
                data: result
            });

        } else {
            return res.status(400).json({
                success: false,
                message: "match_id or match_id array is required"
            });
        }

    } catch (error) {
        console.error("Error creating contest:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



exports.changeContestStatus = async (req, res) => {
    try {

        let adminId = req.user;

        let admin = await Admin.findById(adminId);

        if (admin.role !== 'superadmin') {
            return res.status(404).json({
                success: false,
                message: 'You do not have permission to perform this actio'
            });
        }

        let { contestId } = req.query

        let { status } = req.body; // Extract contest ID and new status from the request body

        // Find the contest by ID and update its status
        let contest = await Contest.findById(contestId);
        if (!contest) {
            return res.status(404).json({
                success: false,
                message: "Contest not found",
            });
        }

        // Update the status
        contest.status = status;
        await contest.save();

        // Respond with success
        res.status(200).json({
            success: true,
            message: "Contest status updated successfully",
            data: contest,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


exports.editContest = async (req, res) => {
    try {
        let adminId = req.user;


        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { contestId } = req.query
        let { match_id, contest_type_id, price_pool, entry_fees, total_participant, max_team_per_user, profit } = req.body

        let updateData = {
            match_id,
            contest_type_id,
            price_pool,
            entry_fees,
            total_participant,
            max_team_per_user,
            profit
        }

        let updatedData = await Contest.findByIdAndUpdate(contestId, updateData, { new: true });

        if (!updatedData) {
            return res.status(401).json({
                success: false,
                message: "Contest Not Found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Contest Updated Successfully",
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


// exports.contestList = async (req, res) => {
//     try {
//         let adminId = req.user;


//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         let aggregatedData = await Contest.aggregate([
//             {
//                 $lookup: {
//                     from: 'matches',
//                     localField: 'match_id',
//                     foreignField: '_id',
//                     as: 'matchData'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contest-types',
//                     localField: 'contest_type_id',
//                     foreignField: '_id',
//                     as: 'contestTypeData'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'matchData.team_1_id',
//                     foreignField: '_id',
//                     as: 'team1Data'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'matchData.team_2_id',
//                     foreignField: '_id',
//                     as: 'team2Data'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'leagues', // Assuming 'leagues' is the collection name for league data
//                     localField: 'matchData.league_id', // Assuming 'league_id' is the field in the 'matches' collection
//                     foreignField: '_id',
//                     as: 'leagueData'
//                 }
//             }
//         ]);

//         aggregatedData.forEach(contest => {
//             contest.team1Data.forEach(team => {
//                 team.logo = BASE_URL_TEAM + team.logo;
//                 team.other_photo = BASE_URL_TEAM + team.other_photo;
//             });
//             contest.team2Data.forEach(team => {
//                 team.logo = BASE_URL_TEAM + team.logo;
//                 team.other_photo = BASE_URL_TEAM + team.other_photo;
//             });
//         });

//         res.status(200).json({
//             success: true,
//             message: "Contest list with aggregated data retrieved successfully",
//             data: aggregatedData
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }


exports.contestList = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let aggregatedData = await Contest.aggregate([
            {
                $lookup: {
                    from: 'matches',
                    localField: 'match_id',
                    foreignField: '_id',
                    as: 'matchData'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest_type_id',
                    foreignField: '_id',
                    as: 'contestTypeData'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'matchData.team_1_id',
                    foreignField: '_id',
                    as: 'team1Data'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'matchData.team_2_id',
                    foreignField: '_id',
                    as: 'team2Data'
                }
            },
            {
                $lookup: {
                    from: 'leagues',
                    localField: 'matchData.league_id',
                    foreignField: '_id',
                    as: 'leagueData'
                }
            },
            {
                $lookup: {
                    from: 'joincontests',
                    localField: '_id',
                    foreignField: 'contest_id',
                    as: 'joinedParticipants'
                }
            },
            {
                $unwind: {
                    path: "$joinedParticipants",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'contest_details',
                    localField: '_id',
                    foreignField: 'contest_id',
                    as: 'contest_details'
                }
            },
            // {
            //     $unwind: {
            //         path: "$contest_details",
            //         preserveNullAndEmptyArrays: true
            //     }
            // },
            {
                $group: {
                    _id: "$_id",
                    price_pool: { $first: "$price_pool" },
                    entry_fees: { $first: "$entry_fees" },
                    total_participant: { $first: "$total_participant" },
                    max_team_per_user: { $first: "$max_team_per_user" },
                    profit: { $first: "$profit" },
                    date_time: { $first: "$date_time" },
                    matchData: { $first: "$matchData" },
                    contestTypeData: { $first: "$contestTypeData" },
                    team1Data: { $first: "$team1Data" },
                    team2Data: { $first: "$team2Data" },
                    leagueData: { $first: "$leagueData" },
                    contest_details: { $first: "$contest_details" },
                    joinedParticipants: { $push: "$joinedParticipants" },
                    total_participant: { $first: "$total_participant" },
                    joined_team_count: { $sum: { $size: { $ifNull: ["$joinedParticipants.myTeam_id", []] } } }
                }
            },
            // {
            //     $addFields: {
            //         joined_participants_count: { $size: "$joinedParticipants" },
            //         remaining_participants_spots: {
            //             $subtract: ["$total_participant", "$joined_team_count"]
            //         }
            //     }
            // },
            {
                $addFields: {
                    joined_participants_count: { $size: "$joinedParticipants" },
                    remaining_participants_spots: {
                        $subtract: ["$total_participant", "$joined_team_count"]
                    },
                    winningRangeStatus: {
                        $cond: {
                            if: {
                                $gt: [
                                    { $size: { $ifNull: ["$contest_details.rankes", []] } }, // Ensure rankes is an array
                                    0
                                ]
                            },
                            then: "active",
                            else: "inactive"
                        }
                    }
                }
            },
            {
                $unset: 'contest_details'
            },
            {
                $sort: { date_time: -1 } // Sort by date_time in descending order
            }
        ]);

        aggregatedData.forEach(contest => {
            contest.team1Data.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team2Data.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
        });

        res.status(200).json({
            success: true,
            message: "Contest list with aggregated data retrieved successfully",
            data: aggregatedData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}






// exports.displayContestWithDetails = async (req, res) => {
//     try {
//         let adminId = req.user;


//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         const { contestId } = req.query;


//         if (!mongoose.Types.ObjectId.isValid(contestId)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid contestId'
//             });
//         }

//         // Aggregate data from multiple collections based on contestId
//         let contestData = await Contest.aggregate([
//             {
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(contestId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'matches',
//                     localField: 'match_id',
//                     foreignField: '_id',
//                     as: 'matchData'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contest-types',
//                     localField: 'contest_type_id',
//                     foreignField: '_id',
//                     as: 'contestTypeData'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'matchData.team_1_id',
//                     foreignField: '_id',
//                     as: 'team1Data'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'matchData.team_2_id',
//                     foreignField: '_id',
//                     as: 'team2Data'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'leagues', // Assuming 'leagues' is the collection name for league data
//                     localField: 'matchData.league_id', // Assuming 'league_id' is the field in the 'matches' collection
//                     foreignField: '_id',
//                     as: 'leagueData'
//                 }
//             }
//         ]);


//         if (contestData.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Contest not found'
//             });
//         }

//         contestData.forEach(contest => {
//             contest.team1Data.forEach(team => {
//                 team.logo = BASE_URL_TEAM + team.logo;
//                 team.other_photo = BASE_URL_TEAM + team.other_photo;
//             });
//             contest.team2Data.forEach(team => {
//                 team.logo = BASE_URL_TEAM + team.logo;
//                 team.other_photo = BASE_URL_TEAM + team.other_photo;
//             });
//         });


//         res.status(200).json({
//             success: true,
//             message: "Contest details retrieved successfully",
//             data: contestData[0] // Return the first (and only) element of the array
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }


exports.displayContestWithDetails = async (req, res) => {
    try {
        let adminId = req.user;


        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const { contestId } = req.query;


        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contestId'
            });
        }

        // Aggregate data from multiple collections based on contestId
        let contestData = await Contest.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(contestId)
                }
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: 'match_id',
                    foreignField: '_id',
                    as: 'matchData'
                }
            },
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest_type_id',
                    foreignField: '_id',
                    as: 'contestTypeData'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'matchData.team_1_id',
                    foreignField: '_id',
                    as: 'team1Data'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'matchData.team_2_id',
                    foreignField: '_id',
                    as: 'team2Data'
                }
            },
            {
                $lookup: {
                    from: 'leagues',
                    localField: 'matchData.league_id',
                    foreignField: '_id',
                    as: 'leagueData'
                }
            },
            {
                $lookup: {
                    from: 'joincontests',
                    localField: '_id',
                    foreignField: 'contest_id',
                    as: 'joinedParticipants'
                }
            },
            {
                $unwind: {
                    path: "$joinedParticipants",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    price_pool: { $first: "$price_pool" },
                    entry_fees: { $first: "$entry_fees" },
                    total_participant: { $first: "$total_participant" },
                    max_team_per_user: { $first: "$max_team_per_user" },
                    profit: { $first: "$profit" },
                    date_time: { $first: "$date_time" },
                    matchData: { $first: "$matchData" },
                    contestTypeData: { $first: "$contestTypeData" },
                    team1Data: { $first: "$team1Data" },
                    team2Data: { $first: "$team2Data" },
                    leagueData: { $first: "$leagueData" },
                    joinedParticipants: { $push: "$joinedParticipants" },
                    total_participant: { $first: "$total_participant" },
                    joined_team_count: { $sum: { $size: { $ifNull: ["$joinedParticipants.myTeam_id", []] } } }
                }
            },
            {
                $addFields: {
                    joined_participants_count: { $size: "$joinedParticipants" },
                    remaining_participants_spots: {
                        $subtract: ["$total_participant", "$joined_team_count"]
                    }
                }
            }
        ]);

        contestData.forEach(contest => {
            contest.team1Data.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
            contest.team2Data.forEach(team => {
                team.logo = BASE_URL_TEAM + team.logo;
                team.other_photo = BASE_URL_TEAM + team.other_photo;
            });
        });

        res.status(200).json({
            success: true,
            message: "Contest list with aggregated data retrieved successfully",
            data: contestData[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.deleteContest = async (req, res) => {
    try {
        let adminId = req.user;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let { contestId } = req.query

        let deleteData = await Contest.findByIdAndDelete(contestId)

        if (!deleteData) {
            return res.status(401).json({
                success: false,
                message: "Contest  Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Contest Delete Successfully",
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


// User Side
// exports.displayContestDetails = async (req, res) => {
//     try {
//         let userId = req.user;

//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         const { contestId } = req.query;

//         // const contestDetail = await contest.aggregate([
//         //     {
//         //         $match: { _id : new mongoose.Types.ObjectId(contestId) }
//         //     },
//         //     {
//         //         $lookup:{
//         //                 from: 'contest_details',
//         //                 localField: '_id',
//         //                 foreignField: 'contest_id',
//         //                 as: 'Winnings'
//         //             }
//         //     },
//         //     {
//         //         $lookup:{
//         //             from: 'joincontests',
//         //             localField: '_id',
//         //             foreignField: 'contest_id',
//         //             as: 'spots'
//         //         }
//         //     },
//         //     {
//         //         $addFields: {
//         //             spotsCount: { $size: "$spots" }
//         //         }
//         //     },
//         //     {
//         //         $project: {
//         //             _id: 0,
//         //             Winnings: 1,
//         //             spotsCount: 1
//         //         }
//         //     }

//         // ]);
//         const contestDetails = await contest.findById(contestId);
//         const prizeDistro = await contest_detail.findOne({ contest_id: contestId });
//         const spots = await joinContest.aggregate([
//             {
//                 $match: {
//                     contest_id: new mongoose.Types.ObjectId(contestId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "user_id",
//                     foreignField: "_id",
//                     as: "user_details",
//                 }
//             },
//             {
//                 $project: {
//                     "user_id": 1,
//                     "contest_id": 1,
//                     "myTeam_id": 1,
//                     "user_details._id": 1,
//                     "user_details.name": 1,
//                     "user_details.profile_photo": 1,
//                     "points": 1,  // Ensure you have this field in your joinContest schema
//                     "rank": 1 
//                 }
//             }
//         ]);

//         spots.forEach(spot => {
//             if (spot.myTeam_id.length > 0) {
//                 console.log(spot.myTeam_id.length)
//                 spot.myTeam_id = spot.myTeam_id.map((teamId, index) => `${teamId}(T${index + 1})`);
//             }
//         });

//         const spotsFilled = spots.length;
//         const adminProfit = contestDetails.profit

//         const maxAmtDistro = (contestDetails.total_participant * contestDetails.entry_fees) * (1 - adminProfit / 100)
//         const currAmtDistro = (spotsFilled * contestDetails.entry_fees) * (1 - adminProfit / 100);

//         console.log("maxAmtDistro: " + maxAmtDistro);
//         console.log("currAmtDistro: " + currAmtDistro);

//         let winnings = prizeDistro.rankes.map((ele) => {
//             return (
//                 { range: ele.range, prize: (maxAmtDistro * (ele.percent / 100)).toFixed(0) }
//             )
//         });
//         console.log("Winnings" + winnings);

//         let currWinnings = prizeDistro.rankes.map((ele) => {
//             return (

//                 { range: ele.range, prize: (currAmtDistro * (ele.percent / 100)).toFixed(0) }
//             )
//         });
//         console.log("Current Winnings" + currWinnings);

//         spots.forEach(spot => {
//             if (spot.user_details[0].profile_photo) {
//                 spot.user_details[0].profile_photo = BASE_URL_PROFILE + spot.user_details[0].profile_photo;
//             }
//         });

//         const finalDetails = {
//             contest_details: contestDetails,
//             maxWinning: winnings,
//             currWinnings: currWinnings,
//             leaderboard: spots
//         }

//         res.status(200).json({
//             success: true,
//             message: "Contest details retrieved successfully",
//             data: finalDetails
//         });


//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }


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

exports.displayContestDetails = async (req, res) => {
    try {
        let userId = req.user;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { contestId } = req.query;

        // Fetch contest details
        const Contest = await contest.findById(contestId);

        const { pointSystems } = await getPointSystemsForMatch(Contest.match_id);

        // Step 2: Create a point map for easy access
        const pointMap = {};
        pointSystems.forEach(point => {
            pointMap[point.status] = point.points; // Map status to points
        });

        const contestDetails = await contest.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(contestId)
                }
            },
            {
                $lookup: {
                    from: 'matches',
                    localField: 'match_id',
                    foreignField: '_id',
                    as: 'matchData'
                }
            },
            {
                $addFields: {
                    match_date: { $arrayElemAt: ['$matchData.date', 0] },
                    match_time: { $arrayElemAt: ['$matchData.time', 0] }
                }
            },
            {
                $unset: "matchData"
            },

        ]);

        if (!contestDetails) {
            return res.status(404).json({
                success: false,
                message: "Contest not found"
            });
        }

        const prizeDistro = await contest_detail.findOne({ contest_id: contestId });

        // const page = parseInt(req.query.page) || 1;
        // const limit = parseInt(req.query.limit) || 5;
        // const skip = (page - 1) * limit;


        const spots = await joinContest.aggregate([
            {
                $match: {
                    contest_id: new mongoose.Types.ObjectId(contestId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details",
                }
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
                        user_id: "$user_id",
                        contest_id: "$contest_id",
                        team_id: "$my_teams._id",
                    },
                    totalPoints: {
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
                    user_details: { $first: { $arrayElemAt: ["$user_details", 0] } }, // Ensure user details are included
                },
            },
            {
                $group: {
                    _id: {
                        user_id: "$_id.user_id",
                        contest_id: "$_id.contest_id",
                        team_id: "$_id.team_id",
                    },
                    totalPoints: { $sum: "$totalPoints" }, // Sum total points for all teams of the user
                    user_details: { $first: "$user_details" }, // Get user details
                    myTeam_id: { $push: "$_id.team_id" }, // Collect team IDs
                },
            },
            // {
            //     $setWindowFields: {
            //         sortBy: { totalPoints: -1 }, // Sort by total Points in descending order
            //         output: {
            //             rank: { $rank: {} }
            //         }
            //     }
            // },
            {
                $setWindowFields: {
                    sortBy: { totalPoints: -1 }, // Sort by total Points in descending order
                    output: {
                        rank: { $rank: {} }
                    }
                }
            },
            {
                $project: {
                    _id: {
                        user_id: "$_id.user_id",
                        contest_id: "$_id.contest_id",
                        team_id: "$_id.team_id" // Keep team ID for each entry
                    },
                    user_id: "$_id.user_id",
                    contest_id: "$_id.contest_id",
                    myTeam_id: "$myTeam_id",
                    user_details: [{
                        _id: "$user_details._id",
                        name: "$user_details.name",
                        profile_photo: {
                            $concat: [BASE_URL_PROFILE, "$user_details.profile_photo"] // Assuming BASE_URL_PROFILE is defined
                        }
                    }],
                    totalPoints: "$totalPoints",
                    rank: 1,
                    winningAmount: { $first: "$winningAmount" } // Assuming winning amount is calculated elsewhere
                }
            },
            // { $skip: skip }, // Skip the calculated number of documents
            // { $limit: limit }
        ]);

        // const totalLeaderboardCount = spots.length;
        // const paginatedLeaderboard = spots.slice(skip, skip + limit);
        const totalParticipants = contestDetails[0].total_participant; // Total allowed participants
        const entryFees = contestDetails[0].entry_fees;

        // Calculate the number of teams joined and the remaining spots

        // Update profile photos with base URL
        // spots.forEach(spot => {
        //     if (spot.user_details[0].profile_photo) {
        //         spot.user_details[0].profile_photo = BASE_URL_PROFILE + spot.user_details[0].profile_photo;
        //     }
        //     // Label the teams as T1, T2, etc.
        //     if (spot.myTeam_id.length > 0) {
        //         // Create a new array with team IDs suffixed with (T1), (T2), etc.
        //         spot.myTeam_id = spot.myTeam_id.map((teamId, index) => `${teamId}(T${index + 1})`);
        //     }
        // });


        // const joinedTeamsCount = spots.reduce((count, spot) => count + spot.myTeam_id.length, 0);
        const joinedTeamsCount = spots.reduce((count, spot) => count + spot.myTeam_id.length, 0);
        const remainingSpots = contestDetails[0].total_participant - joinedTeamsCount;

        // Calculate max and current prize distribution
        const adminProfit = contestDetails[0].profit;
        const maxAmtDistro = (totalParticipants * entryFees) * (1 - adminProfit / 100);
        // console.log(maxAmtDistro)
        const currAmtDistro = (joinedTeamsCount * entryFees) * (1 - adminProfit / 100);
        console.log(currAmtDistro)


        // Calculate max and current prize distribution
        const winnings = prizeDistro.rankes.map((ele) => ({
            range: ele.range,
            // prize: (maxAmtDistro * (ele.percent / 100)).toFixed(0)
            prize: ele.price.toString()
        }));

        const currWinnings = prizeDistro.rankes.map((ele) => ({
            range: ele.range,
            prize: (currAmtDistro * ((ele.percent / (ele.range.length)) / 100)).toFixed(0)
        }));

        // Initialize an object to track the user's team counters
        const userTeamCounters = {};

        // Sort spots by totalPoints or another meaningful criterion (e.g., _id) for proper sequence
        spots.sort((a, b) => b.totalPoints - a.totalPoints); // Sort in descending order by totalPoints

        // Map through the spots and assign sequential team labels
        const leaderboard = spots.map(spot => {
            const userId = spot.user_id.toString(); // Ensure user_id is treated as a string

            // Initialize counter for the user if it doesn't exist
            if (!userTeamCounters[userId]) {
                userTeamCounters[userId] = 1;
            }

            // Generate the team label based on the user's team counter
            const teamLabel = `(T${userTeamCounters[userId]})`;
            userTeamCounters[userId] += 1; // Increment the counter for the next team

            // Return the leaderboard entry with the new teamLabel
            return {
                _id: spot._id,
                user_id: spot.user_id,
                contest_id: spot.contest_id,
                myTeam_id: spot.myTeam_id, // Keep the team IDs
                user_details: spot.user_details,
                totalPoints: spot.totalPoints,
                rank: spot.rank,
                teamLabel: teamLabel, // Add the sequential team label
                // winningAmount: currWinnings.find(w => w.range === spot.rank)?.prize || "0" // Assign winning amount based on rank
            };
        });


        const finalDetails = {
            contest_details: contestDetails[0],
            maxWinning: winnings,
            currWinnings: currWinnings,
            leaderboard: leaderboard,
            joinedTeamsCount,
            remainingSpots,
            //     currentPage: page,
            //     totalPages: Math.ceil(totalLeaderboardCount / limit),
            //     totalLeaderboardCount
        };

        // Calculate the winning amount for each rank and distribute among users with the same rank
        const rankPrizeDistribution = {};

        finalDetails.leaderboard.forEach(user => {
            const rank = user.rank;
            // console.log(rank)
            const winning = currWinnings.find(w => w.range.includes(rank));
            const prizeAmount = winning ? parseFloat(winning.prize) : 0;
            // console.log(prizeAmount)

            if (!rankPrizeDistribution[rank]) {
                rankPrizeDistribution[rank] = {
                    totalPrize: prizeAmount,
                    count: 0
                };
            }
            rankPrizeDistribution[rank].count += 1;
        });

        // console.log(rankPrizeDistribution)

        // Now divide the total prize by the number of users with the same rank
        finalDetails.leaderboard.forEach(user => {
            const rank = user.rank;
            const prizeInfo = rankPrizeDistribution[rank];
            user.winningAmount = prizeInfo ? (prizeInfo.totalPrize / prizeInfo.count).toFixed(0) : "0";
            // console.log(user.winningAmount)
        });


        res.status(200).json({
            success: true,
            message: "Contest details retrieved successfully",
            data: finalDetails
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}



exports.winnerDetails = async (req, res) => {
    try {
        let userId = req.user

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        let currentDate = getISTTime(new Date());

        let startOfToday1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));


        const winner = await joinContest.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_details",
                }
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
                    from: "players",
                    localField: "my_teams.players",
                    foreignField: "_id",
                    as: "playerDetails",
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
            // { $unwind: { path: "$contest_details", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "matches",
                    localField: "contest_details.match_id",
                    foreignField: "_id",
                    as: "match_details",
                },
            },
            {
                $match: {
                    "match_details.date": {
                        $lt: startOfToday1,
                    }
                }
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match_details.team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "match_details.team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            // { $unwind: { path: "$match_details", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "leagues",
                    localField: "match_details.league_id",
                    foreignField: "_id",
                    as: "league_details",
                },
            },
            // { $unwind: { path: "$league_details", preserveNullAndEmptyArrays: true } },
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
                                                                    { $eq: ["$$fielding.secondaryPlayerId", "$$player"] },
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
                                                                { $multiply: [{ $ifNull: ["$$battingStats.runs", 0] }, 1] },
                                                                // { $cond: [{ $gte: ["$$battingStats.runs", 30] }, 2, 0] },
                                                                // { $cond: [{ $gte: ["$$battingStats.runs", 50] }, 6, 0] },
                                                                // { $cond: [{ $gte: ["$$battingStats.runs", 100] }, 14, 0] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.fours", 0] }, 1] },
                                                                { $multiply: [{ $ifNull: ["$$battingStats.sixes", 0] }, 2] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 30] },
                                                                                { $lte: ["$$battingStats.runs", 49] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        2, // Add 2 points if criteria match
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$battingStats.runs", 50] },
                                                                                { $lte: ["$$battingStats.runs", 99] },
                                                                                { $eq: ["$$battingStats.isOut", true] }
                                                                            ]
                                                                        },
                                                                        6, // Add 2 points if criteria match
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
                                                                        14, // Add 2 points if criteria match
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
                                                                        2, // Add 2 points if criteria match
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
                                                                        4, // Add 2 points if criteria match
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
                                                                        6, // Add 2 points if criteria match
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
                                                                        -1, // Deduct 1 point if criteria match
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
                                                                        -2, // Deduct 1 point if criteria match
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
                                                                        -3, // Deduct 1 point if criteria match
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        { $and: [{ $eq: ["$$battingStats.runs", 0] }, { $eq: ["$$battingStats.isOut", true] }] },
                                                                        -2, // Deduct 2 points if runs are 0 and player is out
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
                                                        { $ifNull: ["$$bowlingStats", false] },
                                                        {
                                                            $add: [

                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.wickets", 0] }, 25] },
                                                                // { $cond: [{ $gte: ["$$bowlingStats.wickets", 3] }, 4, 0] },
                                                                // { $cond: [{ $gte: ["$$bowlingStats.wickets", 4] }, 8, 0] },
                                                                // { $cond: [{ $gte: ["$$bowlingStats.wickets", 5] }, 14, 0] },
                                                                { $multiply: [{ $ifNull: ["$$bowlingStats.maidenOvers", 0] }, 10] },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $eq: ["$$bowlingStats.wickets", 3] }// Economy rate < 4
                                                                            ]
                                                                        },
                                                                        4, // Award 6 points
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
                                                                        8, // Award 6 points
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
                                                                        14, // Award 6 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss bowled
                                                                                { $lt: ["$$bowlingStats.economy", 4] } // Economy rate < 4
                                                                            ]
                                                                        },
                                                                        6, // Award 6 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 4] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 4.99] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        4, // Award 4 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 5] }, // Economy rate >= 4
                                                                                { $lte: ["$$bowlingStats.economy", 6] } // Economy rate <= 4.99
                                                                            ]
                                                                        },
                                                                        2, // Award 4 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 9] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 10] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        -2, // Deduct 2 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overss (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 10.01] }, // Economy rate >= 9
                                                                                { $lt: ["$$bowlingStats.economy", 11] } // Economy rate < 10
                                                                            ]
                                                                        },
                                                                        -4, // Deduct 2 points
                                                                        0
                                                                    ]
                                                                },
                                                                {
                                                                    $cond: [
                                                                        {
                                                                            $and: [
                                                                                { $gte: ["$$bowlingStats.overs", "4.0"] }, // Minimum 2 overs (12 balls)
                                                                                { $gte: ["$$bowlingStats.economy", 11] } // Economy rate >= 11
                                                                            ]
                                                                        },
                                                                        -6, // Deduct 6 points
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
                                                        8, // Points for a catch-out
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$runOutStats", false] },
                                                        10, // Points for a catch-out
                                                        0,
                                                    ],
                                                },
                                                {
                                                    $cond: [
                                                        { $ifNull: ["$$stumpingStats", false] },
                                                        10, // Points for a catch-out
                                                        0,
                                                    ],
                                                },
                                            ],
                                        },
                                    },

                                    // },
                                    // ],
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
                        user_id: "$user_id",
                        contest_id: "$contest_id",
                        team_id: "$my_teams._id",
                    },
                    totalPoints: {
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
                                        4, // Bonus points for 3 catches
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
                                        6, // Bonus points for 4 catches
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
                                        8, // Bonus points for 5 catches
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                    user_details: { $first: { $arrayElemAt: ["$user_details", 0] } },
                    contest_details: { $first: { $arrayElemAt: ["$contest_details", 0] } },
                    match_details: { $first: { $arrayElemAt: ["$match_details", 0] } },
                    league_details: { $first: { $arrayElemAt: ["$league_details", 0] } }, // Ensure user details are included
                    team_1_details: { $first: { $arrayElemAt: ["$team_1_details", 0] } }, // Ensure user details are included
                    team_2_details: { $first: { $arrayElemAt: ["$team_2_details", 0] } }, // Ensure user details are included
                },
            },
            {
                $group: {
                    _id: {
                        user_id: "$_id.user_id",
                        contest_id: "$_id.contest_id",
                        team_id: "$_id.team_id",
                    },
                    totalPoints: { $sum: "$totalPoints" }, // Sum total points for all teams of the user
                    user_details: { $first: "$user_details" }, // Get user details
                    contest_details: { $first: "$contest_details" }, // Get user details
                    match_details: { $first: "$match_details" }, // Get user details
                    league_details: { $first: "$league_details" }, // Get user details
                    team_1_details: { $first: "$team_1_details" }, // Get user details
                    team_2_details: { $first: "$team_2_details" }, // Get user details
                    myTeam_id: { $push: "$_id.team_id" }, // Collect team IDs

                },
            },
            {
                $setWindowFields: {
                    partitionBy: "$contest_details._id", // Partition by contest ID
                    sortBy: { totalPoints: -1 }, // Sort by total points in descending order
                    output: {
                        rank: { $rank: {} }, // Calculate rank
                    },
                },
            },
            {
                $group: {
                    _id: "$contest_details._id",
                    league_name: { $first: "$league_details.league_name" },
                    matchType: { $first: "$match_details._id" },
                    createdAt: { $first: "$league_details.createdAt" },
                    updatedAt: { $first: "$league_details.updatedAt" },
                    matches: { $first: "$match_details" },
                    team_1_details: { $first: "$team_1_details" }, // Get user details
                    team_2_details: { $first: "$team_2_details" },
                    contests: {
                        $push: {
                            contest_id: "$contest_details._id",
                            my_team_id: "$_id.team_id",
                            match_id: "$match_details._id",
                            contest_type_id: "$contest_details.contest_type_id",
                            price_pool: "$contest_details.price_pool",
                            entry_fees: "$contest_details.entry_fees",
                            total_participant: "$contest_details.total_participant",
                            max_team_per_user: "$contest_details.max_team_per_user",
                            user_details: {
                                _id: "$user_details._id",
                                name: "$user_details.name",
                                profile_photo: {
                                    $concat: [BASE_URL_PROFILE, "$user_details.profile_photo"]
                                }
                            },
                            totalPoints: "$totalPoints",
                            rank: "$rank", // Add rank calculation here
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    league_name: 1,
                    matchType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    matches: 1,
                    team_1_details: {
                        // Assuming team_1_details has a profile_photo field
                        _id: "$team_1_details._id",
                        teamName: "$team_1_details.team_name",
                        teamShortName: "$team_1_details.short_name",
                        logo: {
                            $concat: [BASE_URL_TEAM, "$team_1_details.logo"]
                        }
                    },
                    team_2_details: {
                        // Assuming team_2_details has a logo field
                        _id: "$team_2_details._id",
                        teamName: "$team_2_details.team_name",
                        teamShortName: "$team_2_details.short_name",
                        logo: {
                            $concat: [BASE_URL_TEAM, "$team_2_details.logo"]
                        }
                    },
                    contests: 1
                }
            },
            {
                $sort: {
                    "matches.match_name": -1
                }
            }

            // { $skip: skip }, // Skip the calculated number of documents
            // { $limit: limit }
        ]);

        const matchIds = winner.map(item => item.matches._id);


        // const { pointSystems } = await getPointSystemsForMatch(matchIds);

        // // Step 2: Create a point map for easy access
        // const pointMap = {};
        // pointSystems.forEach(point => {
        //     pointMap[point.status] = point.points; // Map status to points
        // });

        // console.log()

        if (winner.length > 0) {
            const contestIds = [...new Set(winner.map(match => match._id))];


            const findJoinContest = await joinContest.find({ contest_id: { $in: contestIds } });

            const contestData = await Contest.find({ _id: { $in: contestIds } });


            const prizeDistroData = await contest_detail.find({ contest_id: { $in: contestIds } });

            // const userContestsMap = {};


            const groupedByContestId = contestIds.map(contestId => {

                // if (Array.isArray(spots)) {

                const contests1 = findJoinContest.filter(join => join.contest_id.toString() === contestId.toString());


                const joinedTeamsCount = contests1.reduce((count, spot) => count + spot.myTeam_id.length, 0);
                // const joinedTeamsCount = spots.length
                // console.log(joinedTeamsCount)

                const contestDetails = contestData.find(contest => contest._id.toString() === contestId.toString());
                const prizeDistro = prizeDistroData.find(contest => contest.contest_id.toString() === contestId.toString());

                const remainingSpots = contestDetails?.total_participant - joinedTeamsCount;
                const adminProfit = contestDetails?.profit;

                const maxAmtDistro = (contestDetails?.total_participant * contestDetails?.entry_fees) * (1 - adminProfit / 100);
                const currAmtDistro = (joinedTeamsCount * contestDetails?.entry_fees) * (1 - adminProfit / 100);

                const currWinnings = prizeDistro.rankes.map(ele => ({
                    range: ele.range,
                    prize: (currAmtDistro * ((ele.percent / (ele.range.length)) / 100)).toFixed(0)
                }));

                winner.forEach(user => {
                    const userTeamCount = {};
                    user.contests.forEach(contest => {
                        const userId = contest.user_details._id.toString();
                        console.log("userId::", userId);
                        if (!userTeamCount[userId]) {
                            userTeamCount[userId] = 0; // Start counting from 0
                        }

                        userTeamCount[userId] += 1;
                        // Assign the team label based on the count
                        contest.team_label = `(T${userTeamCount[userId]})`;
                    });
                });

                const rankPrizeDistribution = {}; // To store prize distribution details

                // Loop through each user in the winner's contests
                winner.forEach(user => {
                    if (user.contests) {
                        user.contests.forEach(contestUser => {
                            if (contestUser.contest_id.toString() === contestId.toString()) {
                                const rank = contestUser.rank;
                                // Find the winning amount for the current rank
                                const winning = currWinnings.find(w => w.range.includes(rank));
                                const prizeAmount = winning ? parseFloat(winning.prize) : 0;

                                // Initialize rank distribution if it doesn't exist
                                if (!rankPrizeDistribution[rank]) {
                                    rankPrizeDistribution[rank] = {
                                        totalPrize: 0,
                                        count: 0
                                    };
                                }

                                // Increment the count of users for this rank
                                rankPrizeDistribution[rank].count += 1;

                                // Add the prize amount to the total for this rank
                                rankPrizeDistribution[rank].totalPrize += prizeAmount;
                            }
                        });
                    }

                    user.contests.forEach(user => {
                        if (user.contest_id.toString() === contestId.toString()) {
                            const rank = user.rank;
                            const prizeInfo = rankPrizeDistribution[rank];

                            // Calculate the winning amount for the user
                            user.winningAmount = prizeInfo ? Number((prizeInfo.totalPrize / prizeInfo.count).toFixed(0)) : 0;
                        }
                    });

                });

            });

        } else {
            console.log("No completed matches found.");
        }

        res.status(200).json({
            success: true,
            message: "Contest details retrieved successfully",
            data: winner
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    }
}
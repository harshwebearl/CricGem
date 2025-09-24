const mongoose = require("mongoose");
const JoinContest = require("../models/joinContest");
const User = require("../models/user");
const Contest = require("../models/contest");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");
const Notification = require("../models/notification");
const CoinAddSystem = require("../models/coin_add_system");
const CoinAddDetail = require("../models/coin_add_detail");
const CgCoin = require("../models/cg_coin");

// exports.createJoinContest = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!",
//             });
//         }
//         let { contest_id, myTeam_id } = req.body;

//         let contest = await Contest.findById(contest_id);
//         if (!contest) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Contest not found!",
//             });
//         }

//         // Check total participants for the contest
//         const joinedTeamsCount = await JoinContest.aggregate([
//             { $match: { contest_id: new mongoose.Types.ObjectId(contest_id) } },
//             { $unwind: "$myTeam_id" }, // Flatten the teams
//             { $count: "totalTeamsJoined" } // Count total joined teams
//         ]);

//         const totalTeamsJoined = joinedTeamsCount.length > 0 ? joinedTeamsCount[0].totalTeamsJoined : 0;
//         if (totalTeamsJoined + myTeam_id.length > contest.total_participant) {
//             return res.status(403).json({
//                 success: false,
//                 message: "Contest is full. No more teams can join.",
//             });
//         }


//         let contestFee = await Contest.findById(contest_id).select(
//             "entry_fees -_id"
//         );
//         let currFunds = await Wallet.findOne({ user_id: userId }).select(
//             "funds -_id"
//         );

//         contestFee = contestFee.entry_fees;
//         currFunds = currFunds.funds;



//         if (currFunds < contestFee * myTeam_id.length) {
//             return res.status(403).json({
//                 success: false,
//                 message:
//                     "you have insufficient balance in your wallet. Please add funds.",
//             });
//         }

//         let myContest = await JoinContest.findOne({
//             user_id: userId,
//             contest_id: contest_id,
//         });

//         let joinedContest = myContest;
//         if (myContest) {

//             const existingTeams = myContest.myTeam_id.map(team => team.toString());
//             const newTeams = myTeam_id.map(team => team.toString());

//             // Check if any of the new teams already exist in the user's joined teams
//             const duplicateTeams = newTeams.filter(team => existingTeams.includes(team));
//             if (duplicateTeams.length > 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "You Have Join already joined with Team",
//                 });
//             }

//             const count_of_join_contenst = myContest.myTeam_id.length;
//             console.log("count_of_join_contenst::", count_of_join_contenst)
//             const contest_data = await Contest.findById(contest_id);
//             let max_team_per_user = contest_data.max_team_per_user;

//             if (max_team_per_user < count_of_join_contenst + myTeam_id.length) {
//                 return res.status(403).json({
//                     success: false,
//                     message:
//                         "You have reached the maximum limit of teams for this contest",
//                 });
//             }

//             const myTeams = [...myContest.myTeam_id, ...myTeam_id];
//             joinedContest = await JoinContest.findByIdAndUpdate(
//                 myContest._id,
//                 { myTeam_id: myTeams },
//                 { new: true }
//             );
//         } else {
//             const count_of_join_contenst = myTeam_id.length;
//             const contest_data = await Contest.findById(contest_id);
//             let max_team_per_user = contest_data.max_team_per_user;

//             if (max_team_per_user < count_of_join_contenst) {
//                 return res.status(403).json({
//                     success: false,
//                     message:
//                         "You have reached the maximum limit of teams for this contest",
//                 });
//             }

//             const newData = new JoinContest({
//                 user_id: userId,
//                 contest_id,
//                 myTeam_id,
//             });
//             // return
//             joinedContest = await newData.save();
//         }

//         await Wallet.findOneAndUpdate(
//             { user_id: userId },
//             { $inc: { funds: -contestFee * myTeam_id.length, fundsUtilized: contestFee * myTeam_id.length } }
//         );

//         const transaction = await Transaction.create({
//             user_id: userId,
//             amount: contestFee * myTeam_id.length,
//             payment_mode: "contest",
//             payment_type: "contest_fee",
//             approval: true,
//         });

//         let notification = await Notification.create({
//             user_id: userId,
//             title: "Join Contest Success",
//             message: `You have successfully joined the contest! The price pool is ₹${contest.price_pool}.`,
//         });

//         res.status(200).json({
//             success: true,
//             message: "Contest Join Successfully",
//             data: joinedContest,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };


exports.createJoinContest = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }
        let { contest_id, myTeam_id, use_cgCoin } = req.body;

        use_cgCoin = use_cgCoin || 0;

        let contest = await Contest.findById(contest_id);
        if (!contest) {
            return res.status(404).json({
                success: false,
                message: "Contest not found!",
            });
        }

        // Check total participants for the contest
        const joinedTeamsCount = await JoinContest.aggregate([
            { $match: { contest_id: new mongoose.Types.ObjectId(contest_id) } },
            { $unwind: "$myTeam_id" },
            { $count: "totalTeamsJoined" }
        ]);

        const totalTeamsJoined = joinedTeamsCount.length > 0 ? joinedTeamsCount[0].totalTeamsJoined : 0;
        if (totalTeamsJoined + myTeam_id.length > contest.total_participant) {
            return res.status(403).json({
                success: false,
                message: "Contest is full. No more teams can join.",
            });
        }

        let contestFee = await Contest.findById(contest_id).select("entry_fees -_id");
        let currFunds = await Wallet.findOne({ user_id: userId }).select("funds -_id");
        let userCgCoin = await CgCoin.findOne({ user_id: userId }).select("coin_value -_id");

        contestFee = contestFee.entry_fees;
        currFunds = currFunds ? currFunds.funds : 0;
        userCgCoin = userCgCoin ? userCgCoin.coin_value : 0;

        let totalFee = contestFee * myTeam_id.length;

        // Determine how much cgCoin to use
        let cgCoinUsed = Math.min(use_cgCoin, userCgCoin, totalFee);
        let remainingFee = totalFee - cgCoinUsed;

        if (currFunds < remainingFee) {
            return res.status(403).json({
                success: false,
                message: "Insufficient balance in your wallet. Please add funds.",
            });
        }

        let myContest = await JoinContest.findOne({ user_id: userId, contest_id: contest_id });

        let joinedContest = myContest;
        if (myContest) {
            const existingTeams = myContest.myTeam_id.map(team => team.toString());
            const newTeams = myTeam_id.map(team => team.toString());

            const duplicateTeams = newTeams.filter(team => existingTeams.includes(team));
            if (duplicateTeams.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "You have already joined with this team",
                });
            }

            const count_of_join_contenst = myContest.myTeam_id.length;
            let max_team_per_user = contest.max_team_per_user;

            if (max_team_per_user < count_of_join_contenst + myTeam_id.length) {
                return res.status(403).json({
                    success: false,
                    message: "You have reached the maximum limit of teams for this contest",
                });
            }

            const myTeams = [...myContest.myTeam_id, ...myTeam_id];
            joinedContest = await JoinContest.findByIdAndUpdate(
                myContest._id,
                { myTeam_id: myTeams },
                { new: true }
            );
        } else {
            const count_of_join_contenst = myTeam_id.length;
            let max_team_per_user = contest.max_team_per_user;

            if (max_team_per_user < count_of_join_contenst) {
                return res.status(403).json({
                    success: false,
                    message: "You have reached the maximum limit of teams for this contest",
                });
            }

            const newData = new JoinContest({
                user_id: userId,
                contest_id,
                myTeam_id,
                use_cgCoin: cgCoinUsed,  // Store cgCoin used
            });
            joinedContest = await newData.save();
        }

        // Deduct used `cgCoin`
        if (cgCoinUsed > 0) {
            await CgCoin.findOneAndUpdate(
                { user_id: userId },
                { $inc: { coin_value: -cgCoinUsed } }
            );
        }

        // Deduct remaining fee from wallet
        if (remainingFee > 0) {
            await Wallet.findOneAndUpdate(
                { user_id: userId },
                { $inc: { funds: -remainingFee, fundsUtilized: remainingFee } }
            );
        }

        // Store Transaction
        await Transaction.create({
            user_id: userId,
            amount: remainingFee,
            cgCoin_amount: cgCoinUsed,
            payment_mode: "contest",
            payment_type: "contest_fee",
            approval: true,
        });

        // if (cgCoinUsed > 0) {
        //     await Transaction.create({
        //         user_id: userId,
        //         cgCoin_amount: cgCoinUsed,
        //         payment_mode: "cgCoin",
        //         payment_type: "cg_coin_deduction",
        //         approval: true,
        //     });
        // }

        await Notification.create({
            user_id: userId,
            title: "Join Contest Success",
            message: `You have successfully joined the contest! The prize pool is ₹${contest.price_pool}.`,
        });

        res.status(200).json({
            success: true,
            message: "Contest Joined Successfully",
            data: joinedContest,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



// exports.createJoinContest = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!",
//             });
//         }

//         let { contest_id, myTeam_id } = req.body;

//         let contest = await Contest.findById(contest_id);
//         if (!contest) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Contest not found!",
//             });
//         }

//         // Check total participants for the contest
//         const joinedTeamsCount = await JoinContest.aggregate([
//             { $match: { contest_id: mongoose.Types.ObjectId(contest_id) } },
//             { $unwind: "$myTeam_id" }, // Flatten the teams
//             { $count: "totalTeamsJoined" } // Count total joined teams
//         ]);

//         const totalTeamsJoined = joinedTeamsCount.length > 0 ? joinedTeamsCount[0].totalTeamsJoined : 0;

//         if (totalTeamsJoined + myTeam_id.length > contest.total_participant) {
//             // Trigger new contest creation
//             const newContest = await duplicateContest(contest);
//             return res.status(200).json({
//                 success: false,
//                 message: "Contest is full. A new contest has been created.",
//                 newContestId: newContest._id, // Return the new contest ID
//             });
//         }

//         let contestFee = contest.entry_fees;
//         let currFunds = await Wallet.findOne({ user_id: userId }).select(
//             "funds -_id"
//         );

//         currFunds = currFunds.funds;

//         if (currFunds < contestFee * myTeam_id.length) {
//             return res.status(403).json({
//                 success: false,
//                 message:
//                     "You have insufficient balance in your wallet. Please add funds.",
//             });
//         }

//         let myContest = await JoinContest.findOne({
//             user_id: userId,
//             contest_id: contest_id,
//         });

//         let joinedContest = myContest;
//         if (myContest) {
//             const existingTeams = myContest.myTeam_id.map(team => team.toString());
//             const newTeams = myTeam_id.map(team => team.toString());

//             // Check for duplicate teams
//             const duplicateTeams = newTeams.filter(team => existingTeams.includes(team));
//             if (duplicateTeams.length > 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "You have already joined with one or more of these teams.",
//                 });
//             }

//             const count_of_joined_contest = myContest.myTeam_id.length;
//             const max_team_per_user = contest.max_team_per_user;

//             if (max_team_per_user < count_of_joined_contest + myTeam_id.length) {
//                 return res.status(200).json({
//                     success: false,
//                     message: "You have reached the maximum limit of teams for this contest.",
//                 });
//             }

//             const myTeams = [...myContest.myTeam_id, ...myTeam_id];
//             joinedContest = await JoinContest.findByIdAndUpdate(
//                 myContest._id,
//                 { myTeam_id: myTeams },
//                 { new: true }
//             );
//         } else {
//             const newData = new JoinContest({
//                 user_id: userId,
//                 contest_id,
//                 myTeam_id,
//             });
//             joinedContest = await newData.save();
//         }

//         await Wallet.findOneAndUpdate(
//             { user_id: userId },
//             { $inc: { funds: -contestFee * myTeam_id.length, fundsUtilized: contestFee * myTeam_id.length } }
//         );
//         await Transaction.create({
//             user_id: userId,
//             amount: contestFee * myTeam_id.length,
//             payment_mode: "contest",
//             payment_type: "contest_fee",
//             approval: true,
//         });

//         res.status(200).json({
//             success: true,
//             message: "Contest Joined Successfully",
//             data: joinedContest,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };

// // Function to duplicate contest
// async function duplicateContest(originalContest) {
//     try {
//         const newContestData = {
//             match_id: originalContest.match_id,
//             contest_type_id: originalContest.contest_type_id,
//             price_pool: originalContest.price_pool,
//             entry_fees: originalContest.entry_fees,
//             total_participant: originalContest.total_participant,
//             max_team_per_user: originalContest.max_team_per_user,
//             profit: originalContest.profit,
//             date_time: new Date(), // Set a new date_time
//         };

//         const newContest = new Contest(newContestData);
//         return await newContest.save();
//     } catch (error) {
//         console.error("Error duplicating contest:", error);
//         throw error;
//     }
// }


exports.displayJoinContest = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }
        let { joinContestId } = req.query;

        let displayData = await JoinContest.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(joinContestId),
                },
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "contest_id",
                    foreignField: "_id",
                    as: "contest",
                },
            },
            {
                $unwind: {
                    path: "$contest",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "myteams",
                    localField: "myTeam_id",
                    foreignField: "_id",
                    as: "my_teams"
                }
            }
        ]);

        if (!displayData || displayData.length === 0) {
            return res.status(200).json({
                success: false,
                message: "Join-Contest Not Avaiable",
            });
        }

        res.status(200).json({
            success: true,
            message: "Display Join Contest By User",
            data: displayData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.displayAllContestList = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }
        let diplayList = await JoinContest.aggregate([
            {
                $lookup: {
                    from: "contests",
                    localField: "contest_id",
                    foreignField: "_id",
                    as: "contest",
                },
            },
            {
                $lookup: {
                    from: "myteams",
                    localField: "myTeam_id",
                    foreignField: "_id",
                    as: "myTeam",
                },
            },
            {
                $unwind: "$myTeam",
            },
            {
                $lookup: {
                    from: "players",
                    localField: "myTeam.players",
                    foreignField: "_id",
                    as: "players",
                },
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "contest.match_id",
                    foreignField: "_id",
                    as: "match",
                },
            },
            {
                $project: {
                    contest: 1,
                    myTeam: 1,
                    players: {
                        $map: {
                            input: "$players",
                            as: "player",
                            in: {
                                player_name: "$$player.player_name",
                                player_photo: "$$player.player_photo",
                                nationality: "$$player.nationality",
                                role: "$$player.role",
                                bat_type: "$$player.bat_type",
                                bowl_type: "$$player.bowl_type",
                            },
                        },
                    },
                    match: 1,
                },
            },
        ]);

        if (!diplayList || diplayList.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Join-Contest Not Avaiable",
            });
        }

        const BASE_URL_PLAYER = 'https://batting-api-1.onrender.com/playerPhoto/'

        diplayList.forEach(item => {
            item.players.forEach(player => {
                player.player_photo = BASE_URL_PLAYER + player.player_photo;
            });
        });

        res.status(200).json({
            success: true,
            message: "Display ALl Join Contest",
            data: diplayList,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// exports.myContests = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!",
//             });
//         }

//         const { matchId } = req.query;

//         const myContests = await JoinContest.aggregate([
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
//             {
//                 $unwind: "$contest_details",
//             },
//             {
//                 $match: {
//                     "contest_details.match_id": new mongoose.Types.ObjectId(
//                         matchId
//                     ),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "myteams",
//                     localField: "myTeam_id",
//                     foreignField: "_id",
//                     as: "my_teams"
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$contest_id",
//                     user_id: { $first: "$user_id" },
//                     myTeam_id: { $first: "$myTeam_id" },
//                     createdAt: { $first: "$createdAt" },
//                     updatedAt: { $first: "$updatedAt" },
//                     contest_details: { $first: "$contest_details" },
//                     myTeams: { $first: "$my_teams" }
//                 },
//             },
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Display ALl Join Contest",
//             data: myContests,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };


// exports.myContests = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!",
//             });
//         }

//         const { matchId } = req.query;

//         const myContests = await JoinContest.aggregate([
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
//             {
//                 $unwind: "$contest_details",
//             },
//             {
//                 $match: {
//                     "contest_details.match_id": new mongoose.Types.ObjectId(
//                         matchId
//                     ),
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "myteams",
//                     localField: "myTeam_id",
//                     foreignField: "_id",
//                     as: "my_teams"
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$contest_id",
//                     user_id: { $first: "$user_id" },
//                     myTeam_id: { $first: "$myTeam_id" },
//                     createdAt: { $first: "$createdAt" },
//                     updatedAt: { $first: "$updatedAt" },
//                     contest_details: { $first: "$contest_details" },
//                     myTeams: { $first: "$my_teams" },
//                     joined_team_count: { $sum: { $size: "$myTeam_id" } },  // Count how many teams the user joined
//                 },
//             },
//             {
//                 $addFields: {
//                     remaining_spots: {
//                         $subtract: ["$contest_details.total_participant", "$joined_team_count"]
//                     }
//                 }
//             }
//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Display All Join Contest",
//             data: myContests,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };


// exports.myContests = async (req, res) => {
//     try {
//         const userId = req.user;
//         const { matchId } = req.query;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "User Not Found!",
//             });
//         }

//         const myContests = await JoinContest.aggregate([
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
//             {
//                 $unwind: "$contest_details",
//             },
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
//             {
//                 $lookup: {
//                     from: "contest_details",
//                     localField: "contest_id",
//                     foreignField: "contest_id",
//                     as: "contest_detail",
//                 },
//             },
//             {
//                 $addFields:{
//                     joined_team_count: { $sum: { $size: "$myTeam_id" } },
//                 }
//             },
//             {
//                 $addFields: {
//                     // Count of user's teams joined
//                     remaining_spots: {
//                         $subtract: ["$contest_details.total_participant", "$joined_team_count"]
//                     },
//                     maxAmtDistro: {
//                         $multiply: [
//                             { $multiply: ["$contest_details.total_participant", "$contest_details.entry_fees"] },
//                             { $subtract: [1, { $divide: ["$contest_details.profit", 100] }] }
//                         ]
//                     },
//                     currAmtDistro: {
//                         $multiply: [
//                             { $multiply: ["$joined_team_count", "$contest_details.entry_fees"] },
//                             { $subtract: [1, { $divide: ["$contest_details.profit", 100] }] }
//                         ]
//                     },
//                     maxWinning: {
//                         $map: {
//                             input: "$contest_detail.rankes",
//                             as: "rank",
//                             in: {
//                                 range: "$$rank.range",
//                                 prize: {
//                                     $toString: {
//                                         $round: [
//                                             { $multiply: ["$maxAmtDistro", { $divide: ["$$rank.percent", 100] }] },
//                                             0
//                                         ]
//                                     }
//                                 }
//                             }
//                         }
//                     },
//                     currWinnings: {
//                         $map: {
//                             input: "$contest_detail.rankes",
//                             as: "rank",
//                             in: {
//                                 range: "$$rank.range",
//                                 prize: {
//                                     $toString: {
//                                         $round: [
//                                             { $multiply: ["$currAmtDistro", { $divide: ["$$rank.percent", 100] }] },
//                                             0
//                                         ]
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 },
//             },
//             {
//                 $group: {
//                     _id: "$contest_id",
//                     user_id: { $first: "$user_id" },
//                     myTeam_id: { $first: "$myTeam_id" },
//                     createdAt: { $first: "$createdAt" },
//                     updatedAt: { $first: "$updatedAt" },
//                     contest_details: { $first: "$contest_details" },
//                     // contest_detail: { $first: "$contest_detail" },
//                     myTeams: { $first: "$my_teams" },
//                     joined_team_count: { $first: "$joined_team_count" },
//                     remaining_spots: { $first: "$remaining_spots" },
//                     maxWinning: { $first: "$maxWinning" },
//                     currWinnings: { $first: "$currWinnings" },
//                     currAmtDistro: { $first: "$currAmtDistro" },
//                       maxAmtDistro: { $first: "$maxAmtDistro" },
//                 },
//             },

//         ]);

//         res.status(200).json({
//             success: true,
//             message: "Display All Join Contest",
//             data: myContests,
//         });
//     } catch (error) {
//         console.error('Error fetching my contests:', error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// };


exports.myContests = async (req, res) => {
    try {
        const userId = req.user;
        const { matchId } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        const myContests = await JoinContest.aggregate([
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
                    pipeline: [
                        {
                            $lookup: {
                                from: 'matches',
                                localField: 'match_id',
                                foreignField: '_id',
                                as: 'matchData'
                            },
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
                    ]
                },
            },
            {
                $unwind: "$contest_details",
            },
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
            {
                $lookup: {
                    from: "contest_details",
                    localField: "contest_id",
                    foreignField: "contest_id",
                    as: "contest_detail"
                },
            },
            {
                $unwind: "$contest_detail",
            },
            {
                $lookup: {
                    from: "joincontests", // Look up all teams joined in this contest by any user
                    localField: "contest_id",
                    foreignField: "contest_id",
                    as: "all_joined_teams",
                },
            },
            {
                $addFields: {
                    joined_team_count: {
                        $sum: {
                            $map: {
                                input: "$all_joined_teams",
                                as: "joined",
                                in: { $size: "$$joined.myTeam_id" } // Count teams per contest
                            }
                        }
                    },
                },
            },
            // {
            //     $addFields: {
            //         joined_team_count: { $sum: { $size: "$myTeam_id" } },
            //     }
            // },
            {
                $addFields: {
                    maxAmtDistro: {
                        $multiply: [
                            { $multiply: ["$contest_details.total_participant", "$contest_details.entry_fees"] },
                            { $subtract: [1, { $divide: ["$contest_details.profit", 100] }] }
                        ]
                    },
                    currAmtDistro: {
                        $multiply: [
                            { $multiply: ["$joined_team_count", "$contest_details.entry_fees"] },
                            { $subtract: [1, { $divide: ["$contest_details.profit", 100] }] }
                        ]
                    },
                }
            },
            {
                $addFields: {
                    remaining_spots: {
                        $subtract: ["$contest_details.total_participant", "$joined_team_count"]
                    },
                    maxWinning: {
                        $map: {
                            input: "$contest_detail.rankes",
                            as: "rank",
                            in: {
                                range: "$$rank.range",
                                prize: {
                                    $toString: {
                                        $round: [
                                            "$$rank.price"
                                        ]
                                    }
                                }
                                // {
                                //     $toString: {
                                //         $round: [
                                //             { $multiply: ["$maxAmtDistro", { $divide: ["$$rank.percent", 100] }] },
                                //             0
                                //         ]
                                //     }
                                // }
                            }
                        }
                    },
                    currWinnings: {
                        $map: {
                            input: "$contest_detail.rankes",
                            as: "rank",
                            in: {
                                range: "$$rank.range",
                                prize: {
                                    $toString: {
                                        $round: [
                                            {
                                                $multiply: [
                                                    "$currAmtDistro",
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
                },
            },
            {
                $group: {
                    _id: "$contest_id",
                    user_id: { $first: "$user_id" },
                    myTeam_id: { $first: "$myTeam_id" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                    contest_details: { $first: "$contest_details" },
                    myTeams: { $first: "$my_teams" },
                    joined_team_count: { $first: "$joined_team_count" },
                    remaining_spots: { $first: "$remaining_spots" },
                    maxWinning: { $first: "$maxWinning" },
                    currWinnings: { $first: "$currWinnings" },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Display All Join Contest",
            data: myContests,
        });
    } catch (error) {
        console.error('Error fetching my contests:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

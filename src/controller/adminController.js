const mongoose = require("mongoose");
const Admin = require("../models/admin");
const { adminJwtToken } = require("../utils/jwt");
const User = require("../models/user");
const Groupchat = require("../models/groupchat");
const wallet = require("../models/transaction");
const JoinContest = require("../models/joinContest");
const league = require("../models/league");
const transaction = require("../models/transaction");
const contest = require("../models/contest");
const match = require("../models/match");
const login_history = require("../models/login_history");
const BASE_URL = "https://batting-api-1.onrender.com/userImage";


// exports.adminLogin = async (req, res) => {
//     try {
//         let { username, password } = req.body;
//         let admin = await Admin.findOne({ username });
//         if (admin) {
//             if (password === admin.password) {
//                 let token = await adminJwtToken(admin._id);
//                 // console.log(token);
//                 res.status(200).json({
//                     success: true,
//                     message: "Admin Login Successfully",
//                     data: token,
//                     adminId: admin._id,
//                 });
//             } else {
//                 res.status(400).json({
//                     success: false,
//                     message: "Password Is Incorrect!",
//                 });
//             }
//         } else {
//             res.status(401).json({
//                 success: false,
//                 message: "Username Not Found!",
//             });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//         });
//     }
// };


exports.adminLogin = async (req, res) => {
    try {
        let { username, password, role } = req.body; // Get role from request body
        let admin = await Admin.findOne({ username });

        if (admin) {
            // Check if the role in request matches the role of the admin in the database
            if (role && role === admin.role) {
                // Password check
                if (password === admin.password) {
                    let token = await adminJwtToken(admin._id, admin.role); // Pass role to the token generator
                    res.status(200).json({
                        success: true,
                        message: `${role.charAt(0).toUpperCase() + role.slice(1)} Login Successfully`, // Dynamic message based on role
                        data: token,
                        adminId: admin._id,
                        role: admin.role, // Return the role in the response
                    });
                } else {
                    res.status(400).json({
                        success: false,
                        message: "Password Is Incorrect!",
                    });
                }
            } else {
                res.status(400).json({
                    success: false,
                    message: `Role '${role}' does not match with the provided credentials!`,
                });
            }
        } else {
            res.status(401).json({
                success: false,
                message: "Username Not Found!",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


exports.changePassword = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin Not Found!",
            });
        }
        let { oldPassword, newPassword } = req.body;

        if (oldPassword !== admin.password) {
            return res.status(400).json({
                success: false,
                message: "Old password is not correct",
            });
        }
        admin.password = newPassword;
        await admin.save();
        res.status(200).json({
            success: true,
            message: "Password Change Successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.allUserDisplay = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let allUser = await User.aggregate([
            {
                $project: {
                    unique_id: 1,
                    name: 1,
                    email: 1,
                    mobile: 1,
                    dob: 1,
                    gender: 1,
                    address: 1,
                    profile_photo: 1,
                    city: 1,
                    pincode: 1,
                    state: 1,
                    country: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1
                },
            },
        ]);

        allUser.forEach(user => {
            if (user.profile_photo && !user.profile_photo.startsWith('http')) {
                user.profile_photo = `${BASE_URL}/${user.profile_photo}`;
            }
        });

        if (allUser) {
            res.status(200).json({
                success: true,
                message: "All User Find Successfully",
                data: allUser,
            });
        } else {
            res.status(200).json({
                success: true,
                message: "User Not Found!",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//rakesh
// exports.userDetails = async (req, res) => {
//     try {
//         let adminId = req.user
//         let admin = await Admin.findById(adminId)
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }
//         let userId = req.query.userId
//         let user = await User.aggregate([
//             {
//                 $match: { _id: new mongoose.Types.ObjectId(userId) }
//             },
//             {
//                 $lookup: {
//                     from: 'wallets',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'wallet_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'documents',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'document_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'joincontests',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'joincontest_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contests',
//                     localField: 'joincontest_details.contest_id',
//                     foreignField: '_id',
//                     as: 'contest_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'myteams',
//                     localField: 'joincontest_details.myTeam_id',
//                     foreignField: '_id',
//                     as: 'myteam_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contest-types',
//                     localField: 'contest_details.contest_type_id',
//                     foreignField: '_id',
//                     as: 'contest_type_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'matches',
//                     localField: 'contest_details.match_id',
//                     foreignField: '_id',
//                     as: 'match_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'leagues',
//                     localField: 'match_details.league_id',
//                     foreignField: '_id',
//                     as: 'league_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'match_details.team_1_id',
//                     foreignField: '_id',
//                     as: 'team_1_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'match_details.team_2_id',
//                     foreignField: '_id',
//                     as: 'team_2_details'
//                 }
//             },
//             {
//                 $project: {
//                     unique_id: 1,
//                     name: 1,
//                     email: 1,
//                     mobile: 1,
//                     dob: 1,
//                     gender: 1,
//                     address: 1,
//                     profile_photo: 1,
//                     city: 1,
//                     pincode: 1,
//                     state: 1,
//                     country: 1,
//                     status: 1,
//                     document_details: 1,
//                     wallet_details: 1,
//                     joincontest_details: 1,
//                     contest_details: 1,
//                     contest_type_details: 1,
//                     match_details: 1,
//                     league_details: 1,
//                     team_1_details: 1,
//                     team_2_details: 1
//                 }
//             }
//         ])
//         if (user) {
//             res.status(200).json({
//                 success: true,
//                 message: "User Find Successfully",
//                 data: user
//             })
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "User Not Found!"
//             })
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// }

exports.userDetails = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let userId = req.query.userId;

        // let user = await User.aggregate([

        //     // Match the user by ID
        //     {
        //         $match: { _id: new mongoose.Types.ObjectId(userId) },
        //     },
        //     // Lookup transactions
        //     {
        //         $lookup: {
        //             from: "transactions",
        //             localField: "_id",
        //             foreignField: "user_id",
        //             as: "transactions",
        //         },
        //     },
        //     // Lookup documents
        //     {
        //         $lookup: {
        //             from: "documents",
        //             localField: "_id",
        //             foreignField: "user_id",
        //             as: "document_details",
        //         },
        //     },
        //     // Lookup wallets
        //     {
        //         $lookup: {
        //             from: "wallets",
        //             localField: "_id",
        //             foreignField: "user_id",
        //             as: "wallet_details",
        //         },
        //     },
        //     // Lookup my_teams
        //     {
        //         $lookup: {
        //             from: "myteams",
        //             localField: "_id",
        //             foreignField: "user_id",
        //             as: "my_teams",
        //         },
        //     },
        //     // Unwind my_teams array
        //     {
        //         $unwind: {
        //             path: "$my_teams",
        //             preserveNullAndEmptyArrays: true, // Preserve if no my_teams exist
        //         },
        //     },
        //     // Lookup match details for each my_team
        //     {
        //         $lookup: {
        //             from: "matches",
        //             localField: "my_teams.match_id",
        //             foreignField: "_id",
        //             as: "my_teams.match_details",
        //         },
        //     },
        //     // Unwind match_details array
        //     {
        //         $unwind: {
        //             path: "$my_teams.match_details",
        //             preserveNullAndEmptyArrays: true, // Preserve if no match details exist
        //         },
        //     },
        //     // Lookup league details for each match
        //     {
        //         $lookup: {
        //             from: "leagues",
        //             localField: "my_teams.match_details.league_id",
        //             foreignField: "_id",
        //             as: "my_teams.match_details.league_details",
        //         },
        //     },
        //     // Unwind league_details array
        //     {
        //         $unwind: {
        //             path: "$my_teams.match_details.league_details",
        //             preserveNullAndEmptyArrays: true, // Preserve if no league details exist
        //         },
        //     },
        //     // Lookup contests where the my_team is used
        //     {
        //         $lookup: {
        //             from: 'joinContests',  // Ensure correct collection name
        //             let: { myTeamId: '$my_teams._id' },  // Pass my_teams._id as a variable
        //             pipeline: [
        //                 {
        //                     $match: {
        //                         $expr: {
        //                             $in: ['$$myTeamId', '$myTeam_id']  // Check if my_teams._id is in myTeam_id array
        //                         }
        //                     }
        //                 }
        //             ],
        //             // localField:"my_teams._id",
        //             // foreignField: "myTeam_id",
        //             as: 'my_teams.used_in_contests'
        //         }
        //     },
        //     // Group the results back by user
        //     {
        //         $group: {
        //             _id: "$_id",
        //             unique_id: { $first: "$unique_id" },
        //             name: { $first: "$name" },
        //             email: { $first: "$email" },
        //             mobile: { $first: "$mobile" },
        //             dob: { $first: "$dob" },
        //             gender: { $first: "$gender" },
        //             address: { $first: "$address" },
        //             city: { $first: "$city" },
        //             pincode: { $first: "$pincode" },
        //             state: { $first: "$state" },
        //             country: { $first: "$country" },
        //             status: { $first: "$status" },
        //             profile_photo: { $first: "$profile_photo" },
        //             wallet_details: { $first: "$wallet_details" },
        //             transactions: { $first: "$transactions" },
        //             document_details: { $first: "$document_details" },
        //             my_teams: { $push: "$my_teams" },
        //         },
        //     },
        //     // Project the final result
        //     {
        //         $project: {
        //             _id: 1,
        //             unique_id: 1,
        //             name: 1,
        //             email: 1,
        //             mobile: 1,
        //             dob: 1,
        //             gender: 1,
        //             address: 1,
        //             city: 1,
        //             pincode: 1,
        //             state: 1,
        //             country: 1,
        //             status: 1,
        //             profile_photo: 1,
        //             wallet_details: 1,
        //             transactions: 1,
        //             document_details: 1,
        //             my_teams: 1,
        //         },
        //     }
        // ]);

        // console.log(user);

        let user = await User.aggregate([
            // Match the user by ID
            {
                $match: { _id: new mongoose.Types.ObjectId(userId) },
            },
            // Lookup transactions
            {
                $lookup: {
                    from: "transactions",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "transactions",
                },
            },
            // Lookup documents
            {
                $lookup: {
                    from: "documents",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "document_details",
                },
            },
            // Lookup wallets
            {
                $lookup: {
                    from: "wallets",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "wallet_details",
                },
            },
            // Lookup my_teams
            {
                $lookup: {
                    from: "myteams",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "my_teams",
                },
            },
            // Unwind my_teams array
            {
                $unwind: {
                    path: "$my_teams",
                    preserveNullAndEmptyArrays: true, // Preserve if no my_teams exist
                },
            },
            // Lookup match details for each my_team
            {
                $lookup: {
                    from: "matches",
                    localField: "my_teams.match_id",
                    foreignField: "_id",
                    as: "my_teams.match_details",
                },
            },
            // Unwind match_details array
            {
                $unwind: {
                    path: "$my_teams.match_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no match details exist
                },
            },
            // Lookup league details for each match
            {
                $lookup: {
                    from: "leagues",
                    localField: "my_teams.match_details.league_id",
                    foreignField: "_id",
                    as: "my_teams.match_details.league_details",
                },
            },
            // Unwind league_details array
            {
                $unwind: {
                    path: "$my_teams.match_details.league_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no league details exist
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "my_teams.match_details.team_1_id",
                    foreignField: "_id",
                    as: "my_teams.match_details.team_1_details",
                },
            },
            // Unwind league_details array
            {
                $unwind: {
                    path: "$my_teams.match_details.team_1_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no league details exist
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "my_teams.match_details.team_2_id",
                    foreignField: "_id",
                    as: "my_teams.match_details.team_2_details",
                },
            },
            // Unwind league_details array
            {
                $unwind: {
                    path: "$my_teams.match_details.team_2_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no league details exist
                },
            },
            // Lookup contests where the my_team is used
            {
                $lookup: {
                    from: 'joinContests',  // Ensure correct collection name
                    let: { myTeamId: '$my_teams._id' },  // Pass my_teams._id as a variable
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$$myTeamId', '$myTeam_id']  // Check if my_teams._id is in myTeam_id array
                                }
                            }
                        }
                    ],
                    as: 'my_teams.used_in_contests'
                }
            },
            // Lookup player details for each my_team
            {
                $lookup: {
                    from: 'players',  // Ensure correct collection name
                    localField: 'my_teams.players',
                    foreignField: '_id',
                    as: 'my_teams.players'
                }
            },
            // Lookup captain details for each my_team
            {
                $lookup: {
                    from: 'players',  // Ensure correct collection name
                    localField: 'my_teams.captain',
                    foreignField: '_id',
                    as: 'my_teams.captain'
                }
            },
            // Lookup vice-captain details for each my_team
            {
                $lookup: {
                    from: 'players',  // Ensure correct collection name
                    localField: 'my_teams.vicecaptain',
                    foreignField: '_id',
                    as: 'my_teams.vicecaptain'
                }
            },
            // Unwind captain_details array
            {
                $unwind: {
                    path: "$my_teams.captain_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no captain details exist
                },
            },
            // Unwind vicecaptain_details array
            {
                $unwind: {
                    path: "$my_teams.vicecaptain_details",
                    preserveNullAndEmptyArrays: true, // Preserve if no vicecaptain details exist
                },
            },
            {
                $lookup: {
                    from: "cg_coins",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "cg_coin_details",
                },
            },
            {
                $lookup: {
                    from: "coin_add_details",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "coin_history",
                },
            },
            {
                $set: {
                    wallet_details: {
                        $map: {
                            input: "$wallet_details",
                            as: "wallet",
                            in: {
                                $mergeObjects: [
                                    "$$wallet",  // Existing wallet details
                                    { cg_coins: { $arrayElemAt: ["$cg_coin_details.coin_value", 0] } },// Adding first cg_coin_details object
                                    { cg_coins_createdAt: { $arrayElemAt: ["$cg_coin_details.createdAt", 0] } } // Adding first cg_coin_details object
                                ]
                            }
                        }
                    }
                }
            },
            // {
            //     $set: {
            //         wallet_details: {
            //             $map: {
            //                 input: "$wallet_details",
            //                 as: "wallet",
            //                 in: {
            //                     $mergeObjects: [
            //                         "$$wallet",
            //                         { cg_coins: { $sum: "$coin_add_detail.coin_value" } }, // Summing all coin_value
            //                         { cg_coins_createdAt: { $arrayElemAt: ["$coin_add_detail.createdAt", 0] } }
            //                     ]
            //                 }
            //             }
            //         }
            //     }
            // },
            // Remove cg_coin_details as it's merged into wallet_details
            {
                $unset: "cg_coin_details"
            },
            // {
            //     $set: {
            //         transactions: {
            //             $concatArrays: ["$transactions", "$coin_add_detail"],
            //         },
            //     },
            // },
            // {
            //     $unset: "coin_add_detail",
            // },
            // Group the results back by user
            {
                $group: {
                    _id: "$_id",
                    unique_id: { $first: "$unique_id" },
                    referral_code: { $first: "$referral_code" },
                    name: { $first: "$name" },
                    email: { $first: "$email" },
                    mobile: { $first: "$mobile" },
                    dob: { $first: "$dob" },
                    gender: { $first: "$gender" },
                    address: { $first: "$address" },
                    city: { $first: "$city" },
                    pincode: { $first: "$pincode" },
                    state: { $first: "$state" },
                    country: { $first: "$country" },
                    status: { $first: "$status" },
                    profile_photo: { $first: "$profile_photo" },
                    wallet_details: { $first: "$wallet_details" },
                    transactions: { $first: "$transactions" },
                    coin_history: { $first: "$coin_history" },
                    document_details: { $first: "$document_details" },
                    my_teams: { $push: "$my_teams" },
                },
            },
            // Project the final result
            {
                $project: {
                    _id: 1,
                    unique_id: 1,
                    referral_code: 1,
                    name: 1,
                    email: 1,
                    mobile: 1,
                    dob: 1,
                    gender: 1,
                    address: 1,
                    city: 1,
                    pincode: 1,
                    state: 1,
                    country: 1,
                    status: 1,
                    profile_photo: 1,
                    wallet_details: 1,
                    transactions: 1,
                    coin_history: 1,
                    document_details: 1,
                    my_teams: { $reverseArray: "$my_teams" }
                },
            }
        ]);

        let { my_teams } = user;

        if (user && user.length > 0) {
            // Add base URL to profile_photo if it doesn't already have a full URL
            if (user[0].profile_photo && !user[0].profile_photo.startsWith('http')) {
                user[0].profile_photo = `${BASE_URL}/${user[0].profile_photo}`;
            }
        }
        if (user && user.length > 0) {
            res.status(200).json({
                success: true,
                message: "User Find Successfully",
                data: user[0],
            });
        } else {
            res.status(200).json({
                success: true,
                message: "User Not Found!",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// exports.userDetails = async (req, res) => {
//     try {
//         let adminId = req.user;
//         let admin = await Admin.findById(adminId);
//         if (!admin) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Admin not found'
//             });
//         }

//         let userId = req.query.userId;
//         let user = await User.aggregate([
//             {
//                 $match: { _id: new mongoose.Types.ObjectId(userId) }
//             },
//             {
//                 $lookup: {
//                     from: 'transactions',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'transactions'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'documents',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'document_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'joincontests',
//                     localField: '_id',
//                     foreignField: 'user_id',
//                     as: 'joincontest_details'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$joincontest_details',
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contests',
//                     localField: 'joincontest_details.contest_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$joincontest_details.contest_details',
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'contest-types',
//                     localField: 'joincontest_details.contest_details.contest_type_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details.contest_type_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'matches',
//                     localField: 'joincontest_details.contest_details.match_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details.match_details'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$joincontest_details.contest_details.match_details',
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'leagues',
//                     localField: 'joincontest_details.contest_details.match_details.league_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details.match_details.league_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'joincontest_details.contest_details.match_details.team_1_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details.match_details.team_1_details'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'teams',
//                     localField: 'joincontest_details.contest_details.match_details.team_2_id',
//                     foreignField: '_id',
//                     as: 'joincontest_details.contest_details.match_details.team_2_details'
//                 }
//             },
//             {
//                 $lookup:{
//                     from: 'wallets',
//                     localField: '_id',
//                     foreignField: "user_id",
//                     as: 'wallet_details',
//                 }
//             },
//             {
//                 $group: {
//                     _id: '$_id',
//                     unique_id: { $first: '$unique_id' },
//                     name: { $first: '$name' },
//                     email: { $first: '$email' },
//                     mobile: { $first: '$mobile' },
//                     dob: { $first: '$dob' },
//                     gender: { $first: '$gender' },
//                     address: { $first: '$address' },
//                     city: { $first: '$city' },
//                     pincode: { $first: '$pincode' },
//                     state: { $first: '$state' },
//                     country: { $first: '$country' },
//                     status: { $first: '$status' },
//                     profile_photo: { $first: '$profile_photo' },
//                     wallet_details: { $first: '$wallet_details' },
//                     transactions: { $first: '$transactions' },
//                     document_details: { $first: '$document_details' },
//                     joincontest_details: { $push: '$joincontest_details' }
//                 }
//             }
//         ]);

//         if (user && user.length > 0) {
//             res.status(200).json({
//                 success: true,
//                 message: "User Find Successfully",
//                 data: user[0]
//             });
//         } else {
//             res.status(200).json({
//                 success: true,
//                 message: "User Not Found!"
//             });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error"
//         });
//     }
// };

exports.allDisplayChat = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        // Aggregate to fetch chat messages along with sender details
        let chatMessages = await Groupchat.aggregate([
            {
                $lookup: {
                    from: "users", // Name of the users collection
                    localField: "user_id", // Field in Groupchat collection
                    foreignField: "_id", // Field in users collection
                    as: "user_details", // Alias for the joined documents
                    pipeline: [
                        {
                            $project: { password: 0 }
                        }
                    ]
                },
            },
            {
                $project: {
                    message: 1,
                    dateAndTime: 1,
                    user_details: { $arrayElemAt: ["$user_details", 0] }, // Assuming there is only one user associated with each message
                },
            },
        ]);


        if (chatMessages.length > 0) {
            res.status(200).json({
                success: true,
                message: "Chat messages retrieved successfully",
                data: chatMessages,
            });
        } else {
            res.status(404).json({
                success: false,
                message: "No chat messages found",
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.displayAllWallet = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }
        let allWalletDisplay = await wallet.aggregate([
            {
                $lookup: {
                    from: "users", // Name of the users collection
                    localField: "user_id", // Field in Groupchat collection
                    foreignField: "_id", // Field in users collection
                    as: "user_details", // Alias for the joined documents
                    pipeline: [
                        {
                            $project: { password: 0 }
                        }
                    ]
                },
            },
        ]);
        if (!allWalletDisplay) {
            return res.status(404).json({
                success: false,
                message: "Wallet Not Found!",
            });
        }

        res.status(200).json({
            success: true,
            message: "All Wallet Display Successfully",
            data: allWalletDisplay,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

exports.adminDeshboard = async (req, res) => {
    try {

        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        let totalUser = await User.countDocuments()
        let totalLeagues = await league.countDocuments();

        let totalWalletAmount = await transaction.aggregate([
            {
                $match: {
                    payment_type: 'add_wallet',
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalAmount = totalWalletAmount.length > 0 ? totalWalletAmount[0].totalAmount : 0;

        // Calculate total withdrawal amount
        let totalWithdrawAmount = await transaction.aggregate([
            {
                $match: {
                    payment_type: 'withdraw',
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalWithdrawnAmount = totalWithdrawAmount.length > 0 ? totalWithdrawAmount[0].totalAmount : 0;

        let pendingWithdrawals = await transaction.aggregate([
            {
                $match: {
                    payment_type: 'withdraw',
                    status: 'pending'
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalPendingAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Get pending withdrawals list with user details
        let pendingWithdrawalDetails = await transaction.find({
            payment_type: 'withdraw',
            status: 'pending'
        })
            .populate('user_id', 'name email mobile') // Add the fields you want from the User model
            .sort({ createdAt: -1 }); // Most recent first

        const pendingWithdrawalsData = pendingWithdrawals.length > 0 ? pendingWithdrawals[0] : { count: 0, totalPendingAmount: 0 };

        // pendingWithdrawals: {
        //     count: pendingWithdrawalsData.count,
        //     totalPendingAmount: pendingWithdrawalsData.totalPendingAmount,
        //     details: pendingWithdrawalDetails.map(withdrawal => ({
        //         transactionId: withdrawal._id,
        //         amount: withdrawal.amount,
        //         user: withdrawal.user_id,
        //         payment_mode: withdrawal.payment_mode,
        //         createdAt: withdrawal.createdAt
        //     }))
        // }

        const currentDate = getISTTime();

        // Find upcoming leagues
        const upcomingLeagues = await league.find({
            start_date: { $gt: currentDate }
        })
            .populate('matchType', 'name')
            .sort({ start_date: 1 });

        const formattedUpcomingLeagues = upcomingLeagues.map(league => ({
            id: league._id,
            league_name: league.league_name,
            matchType: league.matchType,
            start_date: league.start_date,
            end_date: league.end_date,
            daysUntilStart: Math.ceil((new Date(league.start_date) - currentDate) / (1000 * 60 * 60 * 24))
        }));

        let trendingContest = await contest.aggregate([
            {
                $lookup: {
                    from: 'contest-types',
                    localField: 'contest_type_id',
                    foreignField: '_id',
                    as: 'contestTypeData'
                }
            },
            {
                $unwind: {
                    path: "$contestTypeData",
                    preserveNullAndEmptyArrays: true
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
            {
                $match: {
                    "contest_details": { $ne: [] }
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
                    contest_details: { $first: "$contest_details" },
                    joinedParticipants: { $push: "$joinedParticipants" },
                    total_participant: { $first: "$total_participant" },
                    contest_name: { $first: "$contestTypeData.contest_type" },
                    joined_team_count: { $sum: { $size: { $ifNull: ["$joinedParticipants.myTeam_id", []] } } }
                }
            },
            {
                $sort: { joined_team_count: -1 }
            },
            {
                $unset: ["contest_details", "joinedParticipants"]
            },
            {
                $limit: 5
            }
        ])

        let totalDepositAmount = await transaction.aggregate([
            {
                $match: {
                    payment_type: 'add_wallet',
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalDepositedAmount = totalDepositAmount.length > 0 ? totalDepositAmount[0].totalAmount : 0;
        // **Top 10 States with Highest User Count**
        let topStates = await User.aggregate([
            {
                $group: {
                    _id: "$state",
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { userCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,         // Remove _id
                    stateName: "$_id", // Rename _id to stateName
                    userCount: 1
                }
            }
        ]);

        // **Top 10 Cities with Highest User Count**
        let topCities = await User.aggregate([
            {
                $group: {
                    _id: "$city",
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { userCount: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,         // Remove _id
                    cityName: "$_id", // Rename _id to cityName
                    userCount: 1
                }
            }
        ]);

        const totalOnlineUsers = await login_history.aggregate([
            {
                $match: {
                    offline_date: null // Select users who haven't logged out
                }
            },
            {
                $group: {
                    _id: "$user_id" // Group by user_id to count unique users
                }
            },
            {
                $count: "totalOnlineUsers" // Count the number of unique users
            }
        ]);

        const onlineUserCount = totalOnlineUsers.length > 0 ? totalOnlineUsers[0].totalOnlineUsers : 0;



        res.status(200).json({
            success: true,
            message: "Admin deshboard find successfully",
            data: {
                totalUser: totalUser,
                totalLeagues: totalLeagues,
                totalWalletAmount: totalAmount,
                totalWithdrawAmount: totalWithdrawnAmount,
                netBalance: totalAmount - totalWithdrawnAmount,
                pendingWithdrawCount: pendingWithdrawalsData.count,
                upcomingLeagues: formattedUpcomingLeagues,
                trendingContest: trendingContest,
                totalDepositAmount: totalAmount - totalWithdrawnAmount,
                topStates,
                topCities,
                totalOnlineUsers: onlineUserCount,
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}
const mongoose = require('mongoose');
const LoginHistory = require('../models/login_history');
const appUpdate = require('../models/app_update');
const advertise = require('../models/advertise');
const BASE_URL = "https://batting-api-1.onrender.com/userImage/";
const BASE_URL_ADS = "https://batting-api-1.onrender.com/ads/";
const CgCoin = require("../models/cg_coin");
const CoinAddDetail = require("../models/coin_add_detail");
const ViewAds = require("../models/view_ads");

exports.slpash_screen = async (req, res) => {
    try {
        let userId = req.user;
        let { online_date, offline_date, online_time, offline_time } = req.body;

        let loginHistory = new LoginHistory({
            user_id: userId,
            online_date,
            online_time,
            offline_date,
            offline_time
        });

        let result = await loginHistory.save();

        let appUpdateData = await appUpdate.findOne({}).sort({ createdAt: -1 });
        let appVersion = appUpdateData.version_code;

        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Time reset to midnight for accurate comparison

        console.log("Current Date:", currentDate);

        let activeAdverts = await advertise.find({
            status: 'active',
            start_date: { $lte: currentDate }, // Start date should be today or earlier
            end_date: { $gte: currentDate } // End date should be today or later
        }).select('photo');

        for (let i = 0; i < activeAdverts.length; i++) {
            activeAdverts[i].photo = `${BASE_URL_ADS}${activeAdverts[i].photo}`;
        }

        res.status(200).json({
            message: 'Success',
            message: "Data find successfully",
            appVersion: appVersion,
            adverts: activeAdverts
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error
        });
    }
}



exports.updateLoginHistory = async (req, res) => {
    try {
        let userId = req.user
        let { online_date, offline_date, online_time, offline_time } = req.body;

        let loginHistory = await LoginHistory.findOne
            ({ user_id: userId }).sort({ createdAt: -1 });

        loginHistory.online_date = online_date;
        loginHistory.offline_date = offline_date;
        loginHistory.online_time = online_time;
        loginHistory.offline_time = offline_time;

        let result = await loginHistory.save();

        res.status(200).json({
            message: 'Success',
            message: "Data updated successfully",
            data: result
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
}


// exports.displayAdminLoginHistory = async (req, res) => {
//     try {
//         let { page = 1, limit = 10, in_date, out_date, state, city } = req.query;
//         page = parseInt(page);
//         limit = parseInt(limit);

//         let matchStage = {}; // Yaha filter conditions add honge

//         // Online Date & Offline Date Range Filter
//         if (in_date && out_date) {
//             let startDate = new Date(in_date);
//             startDate.setHours(0, 0, 0, 0);
//             let endDate = new Date(out_date);
//             endDate.setHours(23, 59, 59, 999);

//             matchStage.$and = [
//                 { online_date: { $gte: startDate, $lte: endDate } },
//                 { offline_date: { $gte: startDate, $lte: endDate } }
//             ];
//         } else if (in_date) {
//             let startDate = new Date(in_date);
//             startDate.setHours(0, 0, 0, 0);
//             matchStage.online_date = { $gte: startDate };
//         } else if (out_date) {
//             let endDate = new Date(out_date);
//             endDate.setHours(23, 59, 59, 999);
//             matchStage.offline_date = { $lte: endDate };
//         }

//         // State Filter
//         if (state) {
//             matchStage["user.state"] = state;
//         }

//         // City Filter
//         if (city) {
//             matchStage["user.city"] = city;
//         }

//         let loginHistory = await LoginHistory.aggregate([
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "user_id",
//                     foreignField: "_id",
//                     as: "user",
//                     pipeline: [
//                         {
//                             $project: {
//                                 password: 0
//                             }
//                         }
//                     ]
//                 }
//             },
//             { $unwind: "$user" },
//             { $match: matchStage }, // Filters apply kar raha hai
//             { $sort: { online_date: -1 } }, // Recent logs first
//             { $skip: (page - 1) * limit },
//             { $limit: limit }
//         ]);

//         // Profile photo URL modify karna
//         for (let i = 0; i < loginHistory.length; i++) {
//             loginHistory[i].user.profile_photo = `${BASE_URL}${loginHistory[i].user.profile_photo}`;
//         }

//         let totalRecords = await LoginHistory.countDocuments(matchStage);

//         res.status(200).json({
//             success: true,
//             message: "Data found successfully",
//             data: loginHistory,
//             totalPages: Math.ceil(totalRecords / limit),
//             currentPage: page
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             message: "Internal Server Error"
//         });
//     }
// };



exports.displayAdminLoginHistory = async (req, res) => {
    try {
        let { page = 1, limit = 50, in_date, out_date, state, city } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        let matchStage = {}; // Filter conditions

        // Online & Offline Date Range Filter
        if (in_date && out_date) {
            let startDate = new Date(in_date);
            startDate.setHours(0, 0, 0, 0);
            let endDate = new Date(out_date);
            endDate.setHours(23, 59, 59, 999);

            matchStage.online_date = { $gte: startDate, $lte: endDate };
        } else if (in_date) {
            let startDate = new Date(in_date);
            startDate.setHours(0, 0, 0, 0);
            matchStage.online_date = { $gte: startDate };
        } else if (out_date) {
            let endDate = new Date(out_date);
            endDate.setHours(23, 59, 59, 999);
            matchStage.online_date = { $lte: endDate };
        }

        let loginHistory = await LoginHistory.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                password: 0
                            }
                        }
                    ]
                }
            },
            { $unwind: "$user" },
            { $match: matchStage }, // Applying filters

            // Grouping by user to calculate online count & total spend time
            {
                $group: {
                    _id: "$user._id",
                    name: { $first: "$user.name" },
                    profile_photo: { $first: "$user.profile_photo" },
                    city: { $first: "$user.city" },
                    state: { $first: "$user.state" },
                    totalOnlineCount: { $sum: 1 }, // Counting login occurrences
                    totalSpendTime: {
                        $sum: {
                            $subtract: [
                                { $toDate: { $concat: ["2025-01-01T", "$offline_time", ":00.000Z"] } },
                                { $toDate: { $concat: ["2025-01-01T", "$online_time", ":00.000Z"] } }
                            ]
                        }
                    }
                }
            },

            // Sorting by total online count (optional)
            { $sort: { totalOnlineCount: -1 } },

            { $skip: (page - 1) * limit },
            { $limit: limit },

            // Formatting total spend time
            {
                $project: {
                    _id: 1,
                    name: 1,
                    profile_photo: { $concat: [BASE_URL, "$profile_photo"] },
                    city: 1,
                    state: 1,
                    totalOnlineCount: 1,
                    totalSpendTime: {
                        $dateToString: {
                            format: "%H:%M:%S",
                            date: { $add: [new Date("1970-01-01T00:00:00Z"), "$totalSpendTime"] }
                        }
                    }
                }
            }
        ]);

        // Calculate entire app usage time
        let totalAppUsage = await LoginHistory.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalTimeSpent: {
                        $sum: {
                            $subtract: [
                                { $toDate: { $concat: ["2025-01-01T", "$offline_time", ":00.000Z"] } },
                                { $toDate: { $concat: ["2025-01-01T", "$online_time", ":00.000Z"] } }
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    entireAppUsageTime: {
                        $dateToString: {
                            format: "%H:%M:%S",
                            date: { $add: [new Date("1970-01-01T00:00:00Z"), "$totalTimeSpent"] }
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Data found successfully",
            data: loginHistory,
            entireAppUsageTime: totalAppUsage.length > 0 ? totalAppUsage[0].entireAppUsageTime : "00:00:00",
            totalPages: Math.ceil(loginHistory.length / limit),
            currentPage: page
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};


exports.addCoinByAds = async (req, res) => {
    try {
        let userId = req.user; // Token se user ID
        let { adsId } = req.body;

        // Ads details fetch karna
        let ads = await advertise.findById(adsId);
        if (!ads) {
            return res.status(400).json({
                success: false,
                message: "Ads not found"
            });
        }

        let coinValue = ads.riverd_coin; // Ads ka CG Coin Value

        // Check if user already has CG Coin entry
        let userCgCoin = await CgCoin.findOne({ user_id: userId });

        if (userCgCoin) {
            // Agar user ka coin record already hai, to usme add karo
            await CgCoin.updateOne(
                { user_id: userId },
                { $inc: { coin_value: coinValue } }
            );
        } else {
            // Naya entry create karo agar user ka CG Coin record nahi hai
            await CgCoin.create({
                user_id: userId,
                coin_value: coinValue
            });
        }

        // Coin Add Details me entry karna
        await CoinAddDetail.create({
            user_id: userId,
            coin_add_from: "advertise",
            coin_value: coinValue,
            date_and_time: new Date(),
        });

        // View Ads me entry karna
        let viewAds = await ViewAds.create({
            adsId: adsId,
            userId: userId
        });

        return res.status(200).json({
            success: true,
            message: "Coins added successfully",
            coin_value: coinValue
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

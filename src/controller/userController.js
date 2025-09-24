const mongoose = require("mongoose");
const User = require("../models/user");
const Contest = require("../models/contest");
const { v4: uuidv4 } = require("uuid");
const { userJwtToken } = require("../utils/jwt");
const Match = require("../models/match");
const league = require("../models/league");
const Wallet = require("../models/wallet");
const my_team = require("../models/my_team");
const moment = require('moment');
const wallet = require("../models/wallet");
const BASE_URL = "https://cricgem-harsh.onrender.com/userImage";
const JoinContest = require("../models/joinContest");
const contest_detail = require("../models/contest_detail");
// const transaction = require("../models/transaction");
const Transaction = require("../models/transaction");
const { body, validationResult } = require("express-validator");
const League = require("../models/league");
const PointSystem = require("../models/PointSystem");
const Notification = require("../models/notification");
const Document = require("../models/document");
// const sendEmail = require("../../sendmail");
const axios = require("axios");
const sendEmail = require("../../sendmail");
const { getReceiverSocketId, io } = require("../socket/socket");
const CoinAddSystem = require("../models/coin_add_system");
const CoinAddDetail = require("../models/coin_add_detail");
const CgCoin = require("../models/cg_coin");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}



exports.userInsert = async (req, res) => {
    try {
        // Input validation using express-validator
        await Promise.all([
            body("email")
                .matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/)
                .withMessage("Email must be a valid")
                .run(req),
            body("mobile")
                .matches(/^[0-9]{10}$/)
                .withMessage("Mobile number must be 10 digits.")
                .run(req),
            body("name")
                .notEmpty()
                .withMessage("Name is required.")
                .run(req),
            body("password")
                .isLength({ min: 6 })
                .withMessage("Password must be at least 6 characters.")
                .run(req),
        ]);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessage = errors.array().map(err => err.msg).join(", ");
            return res.status(400).json({
                success: false,
                message: errorMessage,
            });
        }

        let {
            name,
            email,
            password,
            mobile,
            dob,
            gender,
            address,
            city,
            pincode,
            state,
            country,
            status,
        } = req.body;

        const age = moment().diff(moment(dob, "YYYY-MM-DD"), "years");
        if (age < 16) {
            return res.status(400).json({
                success: false,
                message: "You must be at least 16 years old to register.",
            });
        }

        let unique_id = uuidv4().split("-")[0].substr(0, 6);

        let referral_code = uuidv4().split("-")[0].substr(0, 8);

        let existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already in use!",
            });
        }

        let existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({
                success: false,
                message: "Mobile is already in use!",
            });
        }

        let userData = new User({
            unique_id,
            name,
            email,
            password,
            mobile,
            dob,
            gender,
            address,
            city,
            pincode,
            state,
            country,
            referral_code,
            status,
        });
        let result = await userData.save();

        let notification = await Notification.create({
            user_id: result._id,
            title: "Registration Success",
            message: `Welcome ${result.name}! Your registration was successful.`,
        });

        const socketId = getReceiverSocketId(result._id);
        if (socketId) {
            io.to(socketId).emit('newNotification', notification);
        }

        let wallet = new Wallet({
            user_id: result._id,
        });

        wallet = await wallet.save();

        // Fetch registration coin value
        let coinSystem = await CoinAddSystem.findOne({ coin_add_from: "registration" });

        if (coinSystem && coinSystem.coin_value <= 100) {
            // Add entry in CoinAddDetail
            await CoinAddDetail.create({
                user_id: result._id,
                coin_add_from: "registration",
                coin_value: coinSystem.coin_value,
            });

            // Update or insert into CgCoin
            let userCoin = await CgCoin.findOne({ user_id: result._id });
            if (userCoin) {
                userCoin.coin_value += coinSystem.coin_value;
                await userCoin.save();
            } else {
                await CgCoin.create({
                    user_id: result._id,
                    coin_value: coinSystem.coin_value,
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid coin value for registration",
            });
        }

        res.status(200).json({
            success: true,
            message: "User profile added successfully.",
            data: result,
            wallet,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


exports.useRefferalCode = async (req, res) => {
    try {
        let { referal_no, user_id } = req.body;

        // Referral code ke base par referrer user dhoondhna
        let referrer = await User.findOne({ referral_code: referal_no });

        if (!referrer) {
            return res.status(400).json({
                success: false,
                message: "Invalid referral code.",
            });
        }

        // Coin System se referral coin value fetch karna
        let coinSystem = await CoinAddSystem.findOne({ coin_add_from: "referral" });

        if (!coinSystem) {
            return res.status(400).json({
                success: false,
                message: "Referral coin system not found.",
            });
        }

        // Referral ki entry create karna
        let data = await CoinAddDetail.create({
            user_id: referrer._id,
            coin_add_from: "referral",
            coin_value: coinSystem.coin_value,
            referal_no: referal_no
        });


        await data.save();

        // Referrer ka cg_coin update karna
        let referrerCoin = await CgCoin.findOne({ user_id: referrer._id });

        if (referrerCoin) {
            // Agar coin entry exist karti hai, to update karo
            referrerCoin.coin_value += coinSystem.coin_value;
            await referrerCoin.save();
        } else {
            // Nahi to naye entry banao
            await CgCoin.create({
                user_id: referrer._id,
                coin_value: coinSystem.coin_value
            });
        }

        res.status(200).json({
            success: true,
            message: "User profile added successfully & referral bonus credited.",
            data: data,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


exports.UserLogin = async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase();
        let user = await User.findOne({ email });
        if (user) {
            if (password === user.password) {
                let token = await userJwtToken(user._id);
                res.status(200).json({
                    success: true,
                    message: "User Login Successfully",
                    data: token,
                    userId: user._id,
                });

                let notification = await Notification.create({
                    user_id: user._id,
                    title: "Login Success",
                    message: `Welcome ${user.name}! Your Login was successful.`,
                });

                const socketId = getReceiverSocketId(user._id);
                console.log("socketId match start::", socketId)
                if (socketId) {
                    io.to(socketId).emit('newNotification', notification);
                }
                // await sendEmail(email, notification.title, notification.message)

            } else {
                res.status(400).json({
                    success: false,
                    message: "Password Is Incorrect!",
                });
            }
        } else {
            res.status(401).json({
                success: false,
                message: "Email Not Found!",
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

exports.editUser = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        let {
            name,
            email,
            mobile,
            dob,
            gender,
            address,
            city,
            pincode,
            state,
            country,
        } = req.body;

        if (dob) {
            const age = moment().diff(moment(dob, 'YYYY-MM-DD'), 'years');
            if (age < 16) {
                return res.status(400).json({
                    success: false,
                    message: "You must be at least 16 years old.",
                });
            }
        }

        let updateData = {
            name,
            email,
            mobile,
            dob,
            gender,
            address,
            city,
            pincode,
            state,
            country,
            // profile_photo: BASE_URL + req.file.filename
        };

        if (req.file && req.file.filename) {
            const profile_photo = req.file.filename; // Assuming 'player_photo' is the field name for the player photo file
            updateData.profile_photo = req.file.filename; // Assuming 'player_photo' is the field name for storing the player photo path
        }

        let userUpdateData = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
        });
        res.status(200).json({
            success: true,
            message: "User Updated Successfully",
            data: userUpdateData,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.profileDisplay = async (req, res) => {
    try {
        let userId = req.user;

        // Fetch user details
        let user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        let isVerify = false
        // Fetch all transactions for winnings
        let transaction = await Transaction.find({ user_id: user._id, payment_type: "winning_amount" });
        const totalWinning = transaction.length > 0
            ? transaction.reduce((sum, trans) => sum + trans.amount, 0)
            : 0;


        let manualTransaction = await Transaction.find({ user_id: user._id, payment_type: "manual_payment" });
        const totalAddedManualPayment = manualTransaction.length > 0
            ? manualTransaction.reduce((sum, trans) => sum + trans.amount, 0)
            : 0;

        // Count total contests the user has joined
        const totalContest = await JoinContest.countDocuments({ user_id: user._id });

        // Get contests the user has joined and populate contest and match details
        const contests = await JoinContest.find({ user_id: user._id })
            .populate({
                path: 'contest_id',
                select: 'match_id', // Only include match_id from contest
                populate: {
                    path: 'match_id',
                    select: 'league_id', // Only include league_id from match
                }
            });

        // Extract league_ids from the populated contests
        const leagueIds = contests
            .map(joinedContest => joinedContest.contest_id?.match_id?.league_id)
            .filter(leagueId => leagueId); // Filter out null/undefined values

        // Using a Set to get unique league_ids
        const uniqueLeagueIds = [...new Set(leagueIds.map(leagueId => leagueId.toString()))];

        // Get the total count of unique league_ids
        const totalLeagues = uniqueLeagueIds.length;

        const wallet = await Wallet.findOne({ user_id: userId });
        const totalWinningContest = wallet?.processedContests?.length || 0;

        // If the user has a profile photo, add the base URL to it
        if (user.profile_photo) {
            user.profile_photo = `${BASE_URL}/${user.profile_photo}`;
        }

        let document = await Document.findOne({ user_id: userId });

        if (document) {
            if (document.adhaar_card_status === "approved" || document.pan_card_status === "approved") {
                isVerify = true
            }
        }
        const cgCoinsData = await CgCoin.find({ user_id: userId });

        // Sum up the CG coins
        const cgCoins = cgCoinsData.length > 0
            ? cgCoinsData.reduce((sum, coin) => sum + coin.coin_value, 0)
            : 0;

        // Send response with user details and calculated data
        res.status(200).json({
            success: true,
            message: "User Display Successfully",
            data: user,
            totalWinning: totalWinning || 0,
            totalContest: totalContest || 0,
            totalMatches: contests.length || 0,
            totalWinningContest: totalWinningContest || 0,
            series: totalLeagues || 0,
            isVerify: isVerify,
            cg_coins: cgCoins || 0,
            totalAddedManualPayment: totalAddedManualPayment
        });
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
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }
        let { oldPassword, newPassword } = req.body;

        if (oldPassword !== user.password) {
            return res.status(400).json({
                success: false,
                message: "Old password is not correct",
            });
        }
        user.password = newPassword;
        await user.save();

        await Notification.create({
            user_id: userId,
            title: "Password Changed",
            message: "Your account password has been changed successfully.",
        });

        const socketId = getReceiverSocketId(user._id);
        console.log("socketId match start::", socketId)
        if (socketId) {
            io.to(socketId).emit('newNotification', Notification);
        }

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

exports.displayAllContest = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        let { match_id } = req.query;

        let AllContest = await Contest.aggregate([
            {
                $match: { match_id: new mongoose.Types.ObjectId(match_id) },
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match_details",
                },
            },
            {
                $lookup: {
                    from: "contest-types",
                    localField: "contest_type_id",
                    foreignField: "_id",
                    as: "contest_type_details",
                },
            },
        ]);

        res.status(200).json({
            success: true,
            message: "Display All Contest",
            contests: AllContest,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};


const BASE_URL_TEAM = "https://cricgem-harsh.onrender.com/teamPhoto/";
const BASE_URL_PLAYER = "https://cricgem-harsh.onrender.com/playerPhoto/";

function resetTimeToMidnight(dateString) {
    const date = new Date(dateString);

    // Set time to midnight UTC
    date.setUTCHours(0, 0, 0, 0);

    // Return in ISO format with +00:00
    return date.toISOString().replace('Z', '+00:00');
}



exports.desbord_details_by_user = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        let currentDate = getISTTime(new Date());

        const originalDate = new Date();
        const formattedDate = resetTimeToMidnight(originalDate);
        console.log(formattedDate);


        let startOfToday1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));


        let desbordDetails = await league.aggregate([
            {
                $match: {
                    end_date: { $gte: currentDate },
                },
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "_id",
                    foreignField: "league_id",
                    as: "matches",
                    pipeline: [
                        {
                            $lookup: {
                                from: "contests",
                                localField: "_id",
                                foreignField: "match_id",
                                as: "contest",
                            }
                        }
                    ]
                },
            },
            {
                $unwind: {
                    path: "$matches",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: {
                    "matches.date": { $gte: startOfToday1 },
                    "matches.isStarted": false,
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "matches.team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                    pipeline: [
                        {
                            $lookup: {
                                from: "players",
                                localField: "captain",
                                foreignField: "_id",
                                as: "captain_details",
                                pipeline: [
                                    {
                                        $project: {
                                            captain_photo: { $concat: [BASE_URL_PLAYER, "$player_photo"] }
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$captain_details"
                        },
                        {
                            $addFields: {
                                captain_photo: "$captain_details.captain_photo"
                            }
                        },
                        {
                            $project: {
                                captain_details: 0
                            }
                        }
                    ]
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "matches.team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                    pipeline: [
                        {
                            $lookup: {
                                from: "players",
                                localField: "captain",
                                foreignField: "_id",
                                as: "captain_details",
                                pipeline: [
                                    {
                                        $project: {
                                            captain_photo: { $concat: [BASE_URL_PLAYER, "$player_photo"] }
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: "$captain_details"
                        },
                        {
                            $addFields: {
                                captain_photo: "$captain_details.captain_photo"
                            }
                        },
                        {
                            $project: {
                                captain_details: 0
                            }
                        }
                    ]
                },
            },
            {
                $unwind: {
                    path: "$team_1_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$team_2_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "team_1_details.logo": { $concat: [BASE_URL_TEAM, "$team_1_details.logo"] },
                    "team_1_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_1_details.other_photo"] },
                    "team_2_details.logo": { $concat: [BASE_URL_TEAM, "$team_2_details.logo"] },
                    "team_2_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_2_details.other_photo"] }
                },
            },
            {
                $group: {
                    _id: "$_id",
                    league_details: { $first: "$$ROOT" },
                    matches: {
                        $push: {
                            _id: "$matches._id",
                            league_id: "$matches.league_id",
                            match_name: "$matches.match_name",
                            date: "$matches.date",
                            time: "$matches.time",
                            vanue: "$matches.vanue",
                            city: "$matches.city",
                            state: "$matches.state",
                            country: "$matches.country",
                            isStarted: "$matches.isStarted",
                            isComplated: "$matches.isComplated",
                            megaPrice: { $ifNull: [{ $max: "$matches.contest.price_pool" }, 0] },
                            team_1_details: "$team_1_details",
                            team_2_details: "$team_2_details",
                        },
                    },
                },
            },
            {
                $addFields: {
                    design: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$league_details.league_name", "IPL 2024"] }, then: "Design 1" },
                                { case: { $eq: ["$league_details.league_name", "Indian Premier League 2025"] }, then: "Design 1" },
                                { case: { $eq: ["$league_details.league_name", "T20 World Cup"] }, then: "Design 2" },
                                { case: { $eq: ["$league_details.league_name", "T20 WORLD CUP 2025"] }, then: "Design 2" },
                                { case: { $eq: ["$league_details.league_name", "T20 WORLD CUP 2026"] }, then: "Design 2" },
                                { case: { $eq: ["$league_details.league_name", "Big Bash"] }, then: "Design 3" },
                            ],
                            default: "Default Design"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    league_details: {
                        _id: "$league_details._id",
                        leagua_name: "$league_details.league_name",
                        start_date: "$league_details.start_date",
                        end_date: "$league_details.end_date",
                        createdAt: "$league_details.createdAt",
                        updatedAt: "$league_details.updatedAt",
                        design: "$design",
                        __v: "$league_details.__v",
                        matches: { $slice: ["$matches", 5] },
                    },
                },
            },
            {
                $sort: {
                    "league_details.start_date": 1,
                },
            },
        ]);


        let upcomingMatches = await league.aggregate([
            {
                $lookup: {
                    from: "matches",
                    localField: "_id",
                    foreignField: "league_id",
                    as: "matches",
                },
            },
            {
                $unwind: {
                    path: "$matches",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: {
                    "matches.date": { $gte: currentDate },
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "matches.team_1_id",
                    foreignField: "_id",
                    as: "team_1_details",
                },
            },
            {
                $lookup: {
                    from: "teams",
                    localField: "matches.team_2_id",
                    foreignField: "_id",
                    as: "team_2_details",
                },
            },
            {
                $unwind: {
                    path: "$team_1_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$team_2_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "team_1_details.logo": { $concat: [BASE_URL_TEAM, "$team_1_details.logo"] },
                    "team_1_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_1_details.other_photo"] },
                    "team_2_details.logo": { $concat: [BASE_URL_TEAM, "$team_2_details.logo"] },
                    "team_2_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_2_details.other_photo"] },
                },
            },
            {
                $project: {
                    _id: 0,
                    match_details: {
                        _id: "$matches._id",
                        league_id: "$matches.league_id",
                        match_name: "$matches.match_name",
                        date: "$matches.date",
                        time: "$matches.time",
                        vanue: "$matches.vanue",
                        city: "$matches.city",
                        state: "$matches.state",
                        country: "$matches.country",
                        team_1_details: "$team_1_details",
                        team_2_details: "$team_2_details",
                    },
                },
            },
            {
                $sort: {
                    "match_details.date": 1,
                    "match_details.time": 1,
                },
            },
            {
                $limit: 5,
            },
        ]);

        let userMatches = await my_team.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match_details",
                },
            },
            {
                $match: {
                    "match_details.date": { // Match date is before today
                        $gt: startOfToday1 // Match date is within the last 3 days
                    }
                }
            },
            {
                $unwind: {
                    path: "$match_details",
                    preserveNullAndEmptyArrays: true,
                },
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
            {
                $unwind: {
                    path: "$team_1_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$team_2_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "team_1_details.logo": { $concat: [BASE_URL_TEAM, "$team_1_details.logo"] },
                    "team_1_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_1_details.other_photo"] },
                    "team_2_details.logo": { $concat: [BASE_URL_TEAM, "$team_2_details.logo"] },
                    "team_2_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_2_details.other_photo"] },
                },
            },
            {
                $group: {
                    _id: "$match_id",
                    user_match_details: { $first: "$match_details" },
                    team_1_details: { $first: "$team_1_details" },
                    team_2_details: { $first: "$team_2_details" },
                    players: { $first: "$players" },
                    captain: { $first: "$captain" },
                    vicecaptain: { $first: "$vicecaptain" },
                    createdAt: { $first: "$createdAt" },
                    updatedAt: { $first: "$updatedAt" },
                },
            },
            {
                $sort: {
                    "user_match_details.match_name": 1, // Sort by match_name in ascending order
                },
            },
            {
                $project: {
                    _id: 0,
                    user_match_details: {
                        _id: "$user_match_details._id",
                        league_id: "$user_match_details.league_id",
                        match_name: "$user_match_details.match_name",
                        date: "$user_match_details.date",
                        time: "$user_match_details.time",
                        vanue: "$user_match_details.vanue",
                        city: "$user_match_details.city",
                        state: "$user_match_details.state",
                        country: "$user_match_details.country",
                        team_1_details: "$team_1_details",
                        team_2_details: "$team_2_details",
                        players: "$players",
                        captain: "$captain",
                        vicecaptain: "$vicecaptain",
                        createdAt: "$createdAt",
                        updatedAt: "$updatedAt",
                    },
                },
            },
        ]);

        let userWallet = await wallet.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $project: {
                    _id: 1,
                    funds: 1,
                    fundsUtilized: 1
                }
            }
        ])

        let userWinningAmount = await wallet.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    payment_type: 'winning_amount'
                }
            },
            {
                $project: {
                    _id: 1,
                    funds: 1,
                    fundsUtilized: 1
                }
            }
        ])

        upcomingMatches = { matches: upcomingMatches };
        userMatches = { matches: userMatches };
        userWallet = { wallet: userWallet };
        userWinningAmount = { winning_amount: userWinningAmount }
        desbordDetails = [...desbordDetails, { upcomingMatches }, { userMatches }, { userWallet }, { userWinningAmount }];

        res.status(200).json({
            success: true,
            message: "User desbord details find successfully",
            data: desbordDetails,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { mobile, newPassword } = req.body;

        // Check if mobile is provided
        if (!mobile) {
            return res.status(400).json({ success: false, message: 'Mobile is required' });
        }

        // Find the company by mobile
        const user = await User.findOne({ mobile });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with this mobile' });
        }


        // Update the company's password in the database
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newPassword;
        await user.save();

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}


// async function addWinningAmountToWallet(userId, contestId, totalWinningAmountForUser) {
//     try {
//         // Ensure the winning amount is a valid number
//         const winningAmount = parseFloat(totalWinningAmountForUser);
//         if (isNaN(winningAmount) || winningAmount <= 0) {
//             return { success: false, message: "Invalid winning amount" };
//         }

//         let walletData = await Wallet.findOne({ user_id: userId });

//         if (walletData.processedContests.includes(contestId.toString())) {
//             return {
//                 success: false,
//                 message: "Winning amount for this contest is already added"
//             };
//         }

//         // Update wallet atomically
//         const wallet = await Wallet.findOneAndUpdate(
//             { user_id: userId },
//             {
//                 $inc: { funds: winningAmount }, // Increment funds
//                 $addToSet: { processedContests: contestId }, // Add contestId if not already exists
//             },
//             { new: true, upsert: true } // Return updated wallet and create one if it doesn't exist
//         );

//         // if (!wallet) {
//         //     return {
//         //         success: false,
//         //         message: "Winning amount for this contest is already added or wallet does not exist"
//         //     };
//         // }

//         // Create a transaction
//         const transaction = new Transaction({
//             user_id: userId,
//             amount: winningAmount,
//             payment_mode: "winning",
//             payment_type: "winning_amount",
//             status: "success",
//             approval: true
//         });

//         // Save the transaction
//         await transaction.save();

//         const notificationMessage = `Congratulations! You have won an amount of ${winningAmount}. Your wallet has been credited successfully.`;
//         const notification = await Notification.create({
//             user_id: userId,
//             title: "Winning Notification",
//             message: notificationMessage,
//         });

//         return {
//             success: true,
//             message: "Winning amount added to wallet successfully",
//             wallet
//         };
//     } catch (error) {
//         console.error("Error adding winning amount to wallet:", error);
//         return { success: false, message: "An error occurred", error };
//     }
// }


async function addWinningAmountToWallet(userId, contestId, totalWinningAmountForUser) {
    try {
        // Ensure the winning amount is a valid number
        const winningAmount = parseFloat(totalWinningAmountForUser);
        if (isNaN(winningAmount) || winningAmount <= 0) {
            return { success: false, message: "Invalid winning amount" };
        }

        let walletData = await Wallet.findOne({ user_id: userId });

        if (walletData.processedContests.includes(contestId.toString())) {
            return {
                success: false,
                message: "Winning amount for this contest is already added"
            };
        }

        // Update wallet atomically
        const updateQuery = {
            $inc: { funds: winningAmount } // Increment funds
        };

        // Add the contest ID to processedContests only if the winning amount is greater than 0
        if (winningAmount > 0) {
            updateQuery.$addToSet = { processedContests: contestId };
        }

        const wallet = await Wallet.findOneAndUpdate(
            { user_id: userId },
            updateQuery,
            { new: true, upsert: true } // Return updated wallet and create one if it doesn't exist
        );

        // Create a transaction
        const transaction = new Transaction({
            user_id: userId,
            amount: winningAmount,
            payment_mode: "winning",
            payment_type: "winning_amount",
            status: "success",
            approval: true
        });

        // Save the transaction
        await transaction.save();

        // Add notification for the user
        const notificationMessage = `Congratulations! You have won an amount of ${winningAmount}. Your wallet has been credited successfully.`;
        const notification = await Notification.create({
            user_id: userId,
            title: "Winning Notification",
            message: notificationMessage,
        });

        const socketId = getReceiverSocketId(userId);
        console.log("socketId match start::", socketId)
        if (socketId) {
            io.to(socketId).emit('newNotification', notification);
        }

        return {
            success: true,
            message: "Winning amount added to wallet successfully",
            wallet
        };
    } catch (error) {
        console.error("Error adding winning amount to wallet:", error);
        return { success: false, message: "An error occurred", error };
    }
}



exports.getUserMatches = async (req, res) => {
    try {

        let userId = req.user;

        let currentDate = getISTTime(new Date());


        let startOfToday1 = new Date(Date.UTC(
            currentDate.getUTCFullYear(),
            currentDate.getUTCMonth(),
            currentDate.getUTCDate(),
            0, 0, 0, 0 // Hours, Minutes, Seconds, Milliseconds set to zero
        ));

        let dateOnly = currentDate.toLocaleDateString('en-GB'); // 'DD/MM/YYYY'

        let timeOnly = currentDate.toTimeString().split(' ')[0].slice(0, 5);
        let startOfToday = moment().startOf('day').toDate();

        let endOfToday = moment().endOf('day').toDate();
        let tomorrowStart = moment().add(1, 'days').startOf('day').toDate();
        let tomorrowEnd = moment().add(1, 'days').endOf('day').toDate();
        let threeDaysAgo = moment().subtract(3, 'days').startOf('day').toDate();

        const BASE_URL_TEAM = "https://cricgem-harsh.onrender.com/teamPhoto/";

        let liveMatches = await JoinContest.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: 'contests',
                    localField: "contest_id",
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
            { $unwind: "$match_details" },
            {
                $match: {
                    "match_details.date": { $eq: startOfToday1 },
                    "match_details.time": { $lte: timeOnly }
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_1_id',
                    foreignField: '_id',
                    as: 'team_1_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_2_id',
                    foreignField: '_id',
                    as: 'team_2_details'
                }
            },
            {
                $lookup: {
                    from: 'matchscores',
                    localField: 'match_details._id',
                    foreignField: 'matchId',
                    as: 'matchscore'
                }
            },
            { $unwind: { path: "$matchscore", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: "$match_details._id",
                    contest_id: 1,
                    match_name: "$match_details.match_name",
                    date: "$match_details.date",
                    time: "$match_details.time",
                    city: "$match_details.city",
                    state: "$match_details.state",
                    country: "$match_details.country",
                    isStarted: "$match_details.isStarted",
                    createdAt: "$match_details.createdAt",
                    team_1_details: { $arrayElemAt: ["$team_1_details", 0] },
                    team_2_details: { $arrayElemAt: ["$team_2_details", 0] },
                    teamScore: {
                        team1: {
                            score: {
                                $concat: [
                                    { $ifNull: [{ $toString: "$matchscore.team1.runs" }, "0"] },
                                    "/",
                                    { $ifNull: [{ $toString: "$matchscore.team1.wicket" }, "0"] },
                                    " (",
                                    { $ifNull: ["$matchscore.team1.overs", "0.0"] },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: {
                                $cond: [
                                    { $eq: ["$match_details.team_1_id", "$team_1_details._id"] },
                                    { $arrayElemAt: ["$team_1_details.team_name", 0] },  // Get the first element of the team_name array
                                    { $arrayElemAt: ["$team_2_details.team_name", 0] }  // Get the first element of the team_name array
                                ]
                            }
                        },
                        team2: {
                            score: {
                                $concat: [
                                    { $ifNull: [{ $toString: "$matchscore.team2.runs" }, "0"] },
                                    "/",
                                    { $ifNull: [{ $toString: "$matchscore.team2.wicket" }, "0"] },
                                    " (",
                                    { $ifNull: ["$matchscore.team2.overs", "0.0"] },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: {
                                $cond: [
                                    { $eq: ["$match_details.team_2_id", "$team_2_details._id"] },
                                    { $arrayElemAt: ["$team_2_details.team_name", 0] },  // Get the first element of the team_name array
                                    { $arrayElemAt: ["$team_1_details.team_name", 0] }  // Get the first element of the team_name array
                                ]
                            }
                        }
                    }
                }
            },
            {
                $sort: {
                    "date": 1, // Sort by date in ascending order
                    "time": 1  // Sort by time in ascending order
                }
            }
        ]);

        // let liveMatches = await my_team.aggregate([
        //     {
        //         $match: {
        //             user_id: new mongoose.Types.ObjectId(userId),
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'matches',
        //             localField: 'match_id',
        //             foreignField: '_id',
        //             as: 'match_details'
        //         }
        //     },
        //     { $unwind: "$match_details" },
        //     {
        //         $match: {
        //             "match_details.date": { $eq: startOfToday1 },
        //             "match_details.time": { $lte: timeOnly }
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'contests',
        //             localField: "match_details._id",
        //             foreignField: 'match_id',
        //             as: 'contest_details'
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'teams',
        //             localField: 'match_details.team_1_id',
        //             foreignField: '_id',
        //             as: 'team_1_details'
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'teams',
        //             localField: 'match_details.team_2_id',
        //             foreignField: '_id',
        //             as: 'team_2_details'
        //         }
        //     },
        //     {
        //         $lookup: {
        //             from: 'scoreboards',
        //             localField: 'match_details._id',
        //             foreignField: 'matchId',
        //             as: 'scoreBoard'
        //         }
        //     },
        //     { $unwind: { path: "$scoreBoard", preserveNullAndEmptyArrays: true } },
        //     {
        //         $project: {
        //             _id: "$match_details._id",
        //             contest_id: 1,
        //             match_name: "$match_details.match_name",
        //             date: "$match_details.date",
        //             time: "$match_details.time",
        //             city: "$match_details.city",
        //             state: "$match_details.state",
        //             country: "$match_details.country",
        //             isStarted: "$match_details.isStarted",
        //             createdAt: "$match_details.createdAt",
        //             team_1_details: { $arrayElemAt: ["$team_1_details", 0] },
        //             team_2_details: { $arrayElemAt: ["$team_2_details", 0] },
        //             inning: "$scoreBoard.inning",
        //             battingTeam: "$scoreBoard.battingTeam",
        //             totalRuns: {
        //                 $add: [
        //                     { $sum: "$scoreBoard.batting.runs" },
        //                     { $add: ["$scoreBoard.extras.nb", "$scoreBoard.extras.wide", "$scoreBoard.extras.legByes", "$scoreBoard.extras.byes", "$scoreBoard.extras.penalty"] }
        //                 ]
        //             },
        //             totalWickets: {
        //                 $size: {
        //                     $ifNull: [
        //                         {
        //                             $filter: {
        //                                 input: "$scoreBoard.batting",
        //                                 as: "player",
        //                                 cond: { $eq: ["$$player.isOut", true] }
        //                             }
        //                         },
        //                         [] // Provide an empty array as the default
        //                     ]
        //                 }
        //             },
        //             totalBalls: {
        //                 $sum: "$scoreBoard.balling.balls"
        //             }
        //         }
        //     }
        // ]);

        const matchesResponse = {};

        liveMatches.forEach((match) => {
            const team1Id = match.team_1_details._id.toString();
            const team2Id = match.team_2_details._id.toString();

            if (!matchesResponse[match._id]) {
                matchesResponse[match._id] = {
                    _id: match._id,
                    contest_id: match.contest_id,
                    match_name: match.match_name,
                    date: match.date,
                    time: match.time,
                    city: match.city,
                    state: match.state,
                    country: match.country,
                    isStarted: match.isStarted,
                    createdAt: match.createdAt,
                    team_1_details: {
                        _id: match.team_1_details._id,
                        team_name: match.team_1_details.team_name,
                        short_name: match.team_1_details.short_name,
                        logo: BASE_URL_TEAM + match.team_1_details.logo,
                        other_photo: BASE_URL_TEAM + match.team_1_details.other_photo,
                        color_code: match.team_1_details.color_code
                    },
                    team_2_details: {
                        _id: match.team_2_details._id,
                        team_name: match.team_2_details.team_name,
                        short_name: match.team_2_details.short_name,
                        logo: BASE_URL_TEAM + match.team_2_details.logo,
                        other_photo: BASE_URL_TEAM + match.team_2_details.other_photo,
                        color_code: match.team_2_details.color_code
                    },
                    teamScore: match.teamScore
                };
            }
        });

        const finalMatchesResponse = Object.values(matchesResponse);


        let upcomingMatches = await my_team.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "match_id",
                    foreignField: "_id",
                    as: "match_details",
                },
            },
            {
                $match: {
                    "match_details.date": { // Match date is before today
                        $gt: startOfToday1 // Match date is within the last 3 days
                    }
                }
            },
            {
                $unwind: {
                    path: "$match_details",
                    preserveNullAndEmptyArrays: true,
                },
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
                $unwind: {
                    path: "$team_1_details",
                    preserveNullAndEmptyArrays: true,
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
            {
                $unwind: {
                    path: "$team_2_details",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    "team_1_details.logo": { $concat: [BASE_URL_TEAM, "$team_1_details.logo"] },
                    "team_1_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_1_details.other_photo"] },
                    "team_2_details.logo": { $concat: [BASE_URL_TEAM, "$team_2_details.logo"] },
                    "team_2_details.other_photo": { $concat: [BASE_URL_TEAM, "$team_2_details.other_photo"] },
                },
            },
            {
                $project: {
                    _id: "$match_details._id",
                    match_name: "$match_details.match_name",
                    date: "$match_details.date",
                    team_1_id: "$match_details.team_1_id",
                    team_2_id: "$match_details.team_2_id",
                    time: "$match_details.time",
                    vanue: "$match_details.vanue",
                    city: "$match_details.city",
                    state: "$match_details.state",
                    country: "$match_details.country",
                    isStarted: "$match_details.isStarted",
                    overs: "$match_details.overs",
                    innings: "$match_details.innings",
                    createdAt: "$match_details.createdAt",
                    team_1_details: {
                        _id: "$team_1_details._id",
                        team_name: "$team_1_details.team_name",
                        short_name: "$team_1_details.short_name",
                        logo: "$team_1_details.logo",
                        other_photo: "$team_1_details.other_photo",
                        captain: "$team_1_details.captain",
                        vice_captain: "$team_1_details.vice_captain",
                        league_id: "$team_1_details.league_id",
                        color_code: "$team_1_details.color_code",
                    },
                    team_2_details: {
                        _id: "$team_2_details._id",
                        team_name: "$team_2_details.team_name",
                        short_name: "$team_2_details.short_name",
                        logo: "$team_2_details.logo",
                        other_photo: "$team_2_details.other_photo",
                        captain: "$team_2_details.captain",
                        vice_captain: "$team_2_details.vice_captain",
                        league_id: "$team_2_details.league_id",
                        color_code: "$team_2_details.color_code",
                    },
                },
            },

            {
                $group: {
                    _id: "$_id", // Group by the match ID
                    match_name: { $first: "$match_name" },
                    date: { $first: "$date" },
                    team_1_id: { $first: "$team_1_id" },
                    team_2_id: { $first: "$team_2_id" },
                    time: { $first: "$time" },
                    vanue: { $first: "$vanue" },
                    city: { $first: "$city" },
                    state: { $first: "$state" },
                    country: { $first: "$country" },
                    isStarted: { $first: "$isStarted" },
                    overs: { $first: "$overs" },
                    innings: { $first: "$innings" },
                    createdAt: { $first: "$createdAt" },
                    team_1_details: { $first: "$team_1_details" },
                    team_2_details: { $first: "$team_2_details" },
                },
            },
            {
                $sort: {
                    "match_name": 1, // Sort by match_name in ascending order
                },
            },
        ]);


        let completedMatches = await JoinContest.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: 'contests',
                    localField: "contest_id",
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
                $unwind: "$match_details"
            },
            {
                $match: {
                    "match_details.date": {
                        $lt: startOfToday, // Match date is before today
                        $gte: threeDaysAgo // Match date is within the last 3 days
                    }
                }
            },
            // {
            //     $match: {
            //         "match_details.isComplated": true
            //     }
            // },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_1_id',
                    foreignField: '_id',
                    as: 'team_1_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_2_id',
                    foreignField: '_id',
                    as: 'team_2_details'
                }
            },
            {
                $lookup: {
                    from: 'matchscores',
                    localField: 'match_details._id',
                    foreignField: 'matchId',
                    as: 'matchscore'
                }
            },
            { $unwind: { path: "$matchscore", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: "$match_details._id",
                    contest_id: 1,
                    match_name: "$match_details.match_name",
                    date: "$match_details.date",
                    time: "$match_details.time",
                    city: "$match_details.city",
                    state: "$match_details.state",
                    country: "$match_details.country",
                    isStarted: "$match_details.isStarted",
                    createdAt: "$match_details.createdAt",
                    team_1_details: { $arrayElemAt: ["$team_1_details", 0] },
                    team_2_details: { $arrayElemAt: ["$team_2_details", 0] },
                    // Create teamScore field
                    teamScore: {
                        team1: {
                            score: {
                                $concat: [
                                    { $ifNull: [{ $toString: "$matchscore.team1.runs" }, "0"] },
                                    "/",
                                    { $ifNull: [{ $toString: "$matchscore.team1.wicket" }, "0"] },
                                    " (",
                                    { $ifNull: ["$matchscore.team1.overs", "0.0"] },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: { $arrayElemAt: ["$team_1_details.team_name", 0] } // Get team name as a string
                        },
                        team2: {
                            score: {
                                $concat: [
                                    { $ifNull: [{ $toString: "$matchscore.team2.runs" }, "0"] },
                                    "/",
                                    { $ifNull: [{ $toString: "$matchscore.team2.wicket" }, "0"] },
                                    " (",
                                    { $ifNull: ["$matchscore.team2.overs", "0.0"] },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: { $arrayElemAt: ["$team_2_details.team_name", 0] } // Get team name as a string
                        }
                    }
                }
            },
            {
                $sort: {
                    "date": 1, // Sort by date in ascending order
                    "time": 1  // Sort by time in ascending order
                }
            }
        ]);

        for (let match of completedMatches) {
            if (match.team_1_details) {
                match.team_1_details.logo = BASE_URL_TEAM + match.team_1_details.logo;
                match.team_1_details.other_photo = BASE_URL_TEAM + match.team_1_details.other_photo;
            }
            if (match.team_2_details) {
                match.team_2_details.logo = BASE_URL_TEAM + match.team_2_details.logo;
                match.team_2_details.other_photo = BASE_URL_TEAM + match.team_2_details.other_photo;
            }
        }

        if (completedMatches.length > 0) {

            let matchid = completedMatches.map((item) => item._id)

            const { pointSystems } = await getPointSystemsForMatch(matchid);

            // Step 2: Create a point map for easy access
            const pointMap = {};
            pointSystems.forEach(point => {
                pointMap[point.status] = point.points; // Map status to points
            });


            const spots = await JoinContest.aggregate([
                {
                    $match: { contest_id: { $in: completedMatches.map((item) => new mongoose.Types.ObjectId(item.contest_id)) } }
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
                        user_details: {
                            _id: "$user_details._id",
                            name: "$user_details.name",
                            profile_photo: "$user_details.profile_photo",
                            // profile_photo: {
                            //     $concat: [BASE_URL_PROFILE, "$user_details.profile_photo"] // Assuming BASE_URL_PROFILE is defined
                            // }
                        },
                        // totalPoints: { $floor: "$totalPoints" },
                        totalPoints: "$totalPoints",
                        rank: 1,
                        winningAmount: { $first: "$winningAmount" } // Assuming winning amount is calculated elsewhere
                    }
                }
            ]);


            const leaderboard = spots.map(spot => ({
                _id: spot._id,
                user_id: spot.user_id,
                contest_id: spot.contest_id,
                myTeam_id: spot.myTeam_id, // Wrap in an array to match the desired output
                user_details: spot.user_details,
                totalPoints: spot.totalPoints,
                rank: spot.rank,
                // winningAmount: currWinnings.find(w => w.range === spot.rank)?.prize || "0" // Assign winning amount based on rank
            }));


            if (completedMatches.length > 0) {
                const contestIds = [...new Set(completedMatches.map(match => match.contest_id))];

                const findJoinContest = await JoinContest.find({ contest_id: { $in: contestIds } });

                const contestData = await Contest.find({ _id: { $in: contestIds } });

                const prizeDistroData = await contest_detail.find({ contest_id: { $in: contestIds } });

                const groupedByContestId = contestIds.map(contestId => {

                    // if (Array.isArray(spots)) {

                    const contests = findJoinContest.filter(join => join.contest_id.toString() === contestId.toString());

                    const joinedTeamsCount = contests.reduce((count, spot) => count + spot.myTeam_id.length, 0);
                    // const joinedTeamsCount = spots.length



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

                    const rankPrizeDistribution = {};
                    leaderboard.forEach(user => {
                        if (user.contest_id.toString() == contestId.toString()) {
                            const rank = user.rank;
                            // console.log(rank)
                            const winning = currWinnings.find(w => w.range.includes(rank));
                            // console.log(winning)
                            const prizeAmount = winning ? parseFloat(winning.prize) : 0;
                            if (!rankPrizeDistribution[rank]) {
                                rankPrizeDistribution[rank] = {
                                    totalPrize: prizeAmount,
                                    count: 0
                                };
                            }
                            rankPrizeDistribution[rank].count += 1;
                        }
                    });

                    leaderboard.forEach(user => {
                        if (user.contest_id.toString() == contestId.toString()) {
                            const rank = user.rank;
                            const prizeInfo = rankPrizeDistribution[rank];
                            user.winningAmount = prizeInfo ? (prizeInfo.totalPrize / prizeInfo.count).toFixed(0) : "0";
                        }
                    });

                    let totalWinningAmountForUser = 0;
                    leaderboard.forEach(spot => {
                        if (spot.user_id.toString() == userId && spot.contest_id.toString() == contestId.toString()) { // Check if the spot belongs to the specific user
                            totalWinningAmountForUser += parseFloat(spot.winningAmount) || 0; // Sum up the winnings
                            // console.log(spot.winningAmount)
                        }
                    });

                    completedMatches.forEach(match => {
                        if (match.contest_id.toString() == contestId.toString()) {
                            match.winningAmount = totalWinningAmountForUser.toFixed(0); // Assign the summed winning amount
                        }
                    });


                    completedMatches.forEach(async (match) => {
                        if (match.contest_id.toString() == contestId.toString()) {
                            const contestId = match.contest_id.toString();
                            let totalWinningAmountForUser = 0;

                            leaderboard.forEach((spot) => {
                                if (
                                    spot.user_id.toString() == userId &&
                                    spot.contest_id.toString() == contestId
                                ) {
                                    totalWinningAmountForUser += parseFloat(spot.winningAmount) || 0;
                                }
                            });

                            match.winningAmount = totalWinningAmountForUser.toFixed(0);

                            // console.log(match.winningAmount)

                            const response = await addWinningAmountToWallet(userId, contestId, totalWinningAmountForUser);
                        }
                        // Log success or error message
                    });


                    // addWinningAmountToWallet(userId, contestId, totalWinningAmountForUser)
                    //     .then(response => {
                    //         console.log(response.message); // Log success or error message
                    //     })
                    //     .catch(error => {
                    //         console.error("Error updating wallet:", error);
                    //     });

                });

            } else {
                console.log("No completed matches found.");
            }
        }

        liveMatches = { matches: finalMatchesResponse };
        upcomingMatches = { matches: upcomingMatches };
        completedMatches = { matches: completedMatches };
        userMatchesDetails = [{ liveMatches }, { upcomingMatches }, { completedMatches }];

        res.status(200).json({
            success: true,
            message: "Display Play Match User",
            data: userMatchesDetails
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

async function getPointSystemsForMatch(matchIds) {
    try {
        // Find matches by their IDs
        const matches = await Match.find({ _id: { $in: matchIds } });
        if (matches.length === 0) {
            console.log("No Match found")
        }

        // Assuming all matches belong to the same league for simplicity
        const leagueId = matches[0].league_id;

        // Find the league by its ID
        const league = await League.findById(leagueId);
        if (!league) {
            throw new Error("League not found");
        }

        // Get the matchType from the league
        const matchType = league.matchType;

        // Get point systems for the matchType
        const pointSystems = await PointSystem.aggregate([
            {
                $lookup: {
                    from: "point_types",
                    localField: "pointType",
                    foreignField: "_id",
                    as: "pointTypeDetails",
                },
            },
            {
                $lookup: {
                    from: "point_fors",
                    localField: "pointFor",
                    foreignField: "_id",
                    as: "pointForDetails",
                },
            },
            {
                $match: { matchType: new mongoose.Types.ObjectId(matchType) },
            },
            { $unwind: "$pointTypeDetails" },
            { $unwind: "$pointForDetails" },
            {
                $project: {
                    _id: 1,
                    points: 1,
                    pointType: "$pointTypeDetails.point_type_name",
                    pointFor: "$pointForDetails.point_for_name",
                    status: "$pointForDetails.status",
                },
            },
        ]);

        return { pointSystems, leagueId };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// async function getPointSystemsForMatch(matchIds) {
//     try {
//         // Find matches by their IDs
//         const matches = await Match.find({ _id: { $in: matchIds } });
//         if (matches.length === 0) {
//             console.log("No Match found")
//         }

//         // Assuming all matches belong to the same league for simplicity
//         // const leagueId = matches[0].league_id;
//         const leagueIds = [...new Set(matches.map(match => match.league_id))];
//         console.log("leagueIds::", leagueIds)

//         // Find the league by its ID
//         // const league = await League.findById(leagueId);
//         // if (!league) {
//         //     throw new Error("League not found");
//         // }

//         const leagues = await League.find({ _id: { $in: leagueIds } });
//         console.log("leagues::", leagues)
//         if (leagues.length === 0) {
//             throw new Error("No leagues found for the matches");
//         }
//         // Get the matchType from the league
//         // const matchType = league.matchType;

//         const matchTypes = [...new Set(leagues.map(league => league.matchType))];
//         console.log("matchTypes::", matchTypes)


//         // secound method

//         // const matchTypeMap = {};
//         // leagues.forEach(league => {
//         //     matchTypeMap[league._id.toString()] = league.matchType;
//         // });

//         // // Extract unique matchTypes from leagues
//         // const matchTypes = [...new Set(leagues.map(league => league.matchType))];

//         // Get point systems for the matchType
//         const pointSystems = await PointSystem.aggregate([
//             {
//                 $lookup: {
//                     from: "point_types",
//                     localField: "pointType",
//                     foreignField: "_id",
//                     as: "pointTypeDetails",
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "point_fors",
//                     localField: "pointFor",
//                     foreignField: "_id",
//                     as: "pointForDetails",
//                 },
//             },
//             // {
//             //     $match: { matchType: new mongoose.Types.ObjectId(matchType) },
//             // },
//             {
//                 $match: { matchType: { $in: matchTypes.map(mt => new mongoose.Types.ObjectId(mt)) } },
//             },
//             { $unwind: "$pointTypeDetails" },
//             { $unwind: "$pointForDetails" },
//             {
//                 $project: {
//                     _id: 1,
//                     points: 1,
//                     pointType: "$pointTypeDetails.point_type_name",
//                     pointFor: "$pointForDetails.point_for_name",
//                     status: "$pointForDetails.status",
//                 },
//             },
//         ]);

//         return { pointSystems, leagueIds };
//     } catch (error) {
//         console.error(error);
//         throw error;
//     }
// } 

exports.lastRecentlyPlayerdMatchByUser = async (req, res) => {
    try {
        let userId = req.user;

        // Get the current date set to midnight
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        let completedMatches = await JoinContest.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: 'contests',
                    localField: "contest_id",
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
                $unwind: "$match_details"
            },
            {
                $match: {
                    "match_details.date": { $lt: currentDate } // Only include matches before today
                }
            },
            // {
            //     $match: {
            //         "match_details.isComplated": true // Only include matches before today
            //     }
            // },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_1_id',
                    foreignField: '_id',
                    as: 'team_1_details'
                }
            },
            {
                $lookup: {
                    from: 'teams',
                    localField: 'match_details.team_2_id',
                    foreignField: '_id',
                    as: 'team_2_details'
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
                    from: 'matchscores',
                    localField: 'match_details._id',
                    foreignField: 'matchId',
                    as: 'matchscore'
                }
            },
            { $unwind: { path: "$matchscore", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'superovers',
                    localField: 'match_details._id',
                    foreignField: 'matchId',
                    as: 'superover'
                }
            },
            {
                $lookup: {
                    from: 'secoundsuperovers',
                    localField: 'match_details._id',
                    foreignField: 'matchId',
                    as: 'secondsuperover'
                }
            },
            {
                $sort: {
                    'match_details.createdAt': -1
                }
            },
            {
                $project: {
                    _id: "$match_details._id",
                    contest_id: 1,
                    match_name: "$match_details.match_name",
                    date: "$match_details.date",
                    time: "$match_details.time",
                    city: "$match_details.city",
                    state: "$match_details.state",
                    country: "$match_details.country",
                    isStarted: "$match_details.isStarted",
                    createdAt: "$match_details.createdAt",
                    totalPoints: { $max: "$totalPoints" },
                    team_1_details: { $arrayElemAt: ["$team_1_details", 0] },
                    team_2_details: { $arrayElemAt: ["$team_2_details", 0] },
                    teamScore: {
                        team1: {
                            score: {
                                $concat: [
                                    { $toString: { $ifNull: ["$matchscore.team1.runs", 0] } },
                                    "/",
                                    { $toString: { $ifNull: ["$matchscore.team1.wicket", 0] } },
                                    " (",
                                    { $toString: { $ifNull: ["$matchscore.team1.overs", "0.0"] } },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: {
                                $cond: {
                                    if: { $eq: ["$matchscore.team1.teamId", "$team_1_details._id"] },
                                    then: { $arrayElemAt: ["$team_1_details.team_name", 0] },
                                    else: { $arrayElemAt: ["$team_2_details.team_name", 0] }
                                }
                            },
                        },
                        team2: {
                            score: {
                                $concat: [
                                    { $toString: { $ifNull: ["$matchscore.team2.runs", 0] } },
                                    "/",
                                    { $toString: { $ifNull: ["$matchscore.team2.wicket", 0] } },
                                    " (",
                                    { $toString: { $ifNull: ["$matchscore.team2.overs", "0.0"] } },
                                    ")"
                                ]
                            },
                            innings: "$match_details.innings",
                            team_name: {
                                $cond: {
                                    if: { $eq: ["$matchscore.team2.teamId", "$team_2_details._id"] },
                                    then: { $arrayElemAt: ["$team_2_details.team_name", 0] },
                                    else: { $arrayElemAt: ["$team_1_details.team_name", 0] }
                                }
                            },
                        }
                    },
                    matchResult: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $and: [
                                            { $eq: ["$matchscore.team1.runs", "$matchscore.team2.runs"] }, // Match tied
                                            { $ne: ["$superover", null] } // Super Over exists
                                        ]
                                    },
                                    then: {
                                        $cond: {
                                            if: { $gt: ["$superover.team1.runs", "$superover.team2.runs"] },
                                            then: {
                                                $concat: [
                                                    "Match tied (",
                                                    {
                                                        $cond: {
                                                            if: { $eq: ["$superover.team1.teamId", "$team_1_details._id"] },
                                                            then: { $arrayElemAt: ["$team_1_details.team_name", 0] },
                                                            else: { $arrayElemAt: ["$team_2_details.team_name", 0] }
                                                        }
                                                    },
                                                    " won the 1st Super Over)"
                                                ]
                                            },
                                            else: {
                                                $cond: {
                                                    if: { $gt: ["$superover.team2.runs", "$superover.team1.runs"] },
                                                    then: {
                                                        $concat: [
                                                            "Match tied (",
                                                            {
                                                                $cond: {
                                                                    if: { $eq: ["$superover.team2.teamId", "$team_2_details._id"] },
                                                                    then: { $arrayElemAt: ["$team_2_details.team_name", 0] },
                                                                    else: { $arrayElemAt: ["$team_1_details.team_name", 0] }
                                                                }
                                                            },
                                                            " won the 1st Super Over)"
                                                        ]
                                                    },
                                                    else: { // 1st Super Over tied
                                                        $cond: {
                                                            if: { $ne: ["$secondsuperover", null] }, // Second Super Over exists
                                                            then: {
                                                                $cond: {
                                                                    if: { $gt: ["$secondsuperover.team1.runs", "$secondsuperover.team2.runs"] },
                                                                    then: {
                                                                        $concat: [
                                                                            "Match tied (",
                                                                            {
                                                                                $cond: {
                                                                                    if: { $eq: ["$secondsuperover.team1.teamId", "$team_1_details._id"] },
                                                                                    then: { $arrayElemAt: ["$team_1_details.team_name", 0] },
                                                                                    else: { $arrayElemAt: ["$team_2_details.team_name", 0] }
                                                                                }
                                                                            },
                                                                            " won the 2nd Super Over)"
                                                                        ]
                                                                    },
                                                                    else: {
                                                                        $cond: {
                                                                            if: { $gt: ["$secondsuperover.team2.runs", "$secondsuperover.team1.runs"] },
                                                                            then: {
                                                                                $concat: [
                                                                                    "Match tied (",
                                                                                    {
                                                                                        $cond: {
                                                                                            if: { $eq: ["$secondsuperover.team2.teamId", "$team_2_details._id"] },
                                                                                            then: { $arrayElemAt: ["$team_2_details.team_name", 0] },
                                                                                            else: { $arrayElemAt: ["$team_1_details.team_name", 0] }
                                                                                        }
                                                                                    },
                                                                                    " won the 2nd Super Over)"
                                                                                ]
                                                                            },
                                                                            else: "Match tied (No winner in Super Overs)"
                                                                        }
                                                                    }
                                                                }
                                                            },
                                                            else: "Match tied (No winner in Super Overs)"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    case: { $gt: ["$matchscore.team1.runs", "$matchscore.team2.runs"] },
                                    then: {
                                        $concat: [
                                            {
                                                $cond: {
                                                    if: { $eq: ["$matchscore.team1.teamId", "$team_1_details._id"] },
                                                    then: { $arrayElemAt: ["$team_1_details.team_name", 0] },
                                                    else: { $arrayElemAt: ["$team_2_details.team_name", 0] }
                                                }
                                            },
                                            " won by ",
                                            {
                                                $toString: {
                                                    $subtract: [
                                                        "$matchscore.team1.runs",
                                                        "$matchscore.team2.runs"
                                                    ]
                                                }
                                            },
                                            " runs"
                                        ]
                                    }
                                },
                                {
                                    case: { $gt: ["$matchscore.team2.runs", "$matchscore.team1.runs"] },
                                    then: {
                                        $concat: [
                                            {
                                                $cond: {
                                                    if: { $eq: ["$matchscore.team2.teamId", "$team_2_details._id"] },
                                                    then: { $arrayElemAt: ["$team_2_details.team_name", 0] },
                                                    else: { $arrayElemAt: ["$team_1_details.team_name", 0] }
                                                }
                                            },
                                            " won by ",
                                            {
                                                $toString: {
                                                    $subtract: [
                                                        "$matchscore.team2.runs",
                                                        "$matchscore.team1.runs"
                                                    ]
                                                }
                                            },
                                            " runs"
                                        ]
                                    }
                                }
                            ],
                            default: "Match Not Completed"
                        }
                    }
                }
            },
            {
                $limit: 1
            }
        ]);

        if (completedMatches.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No completed matches found for the user."
            });
        }

        for (let match of completedMatches) {
            if (match.team_1_details) {
                match.team_1_details.logo = BASE_URL_TEAM + match.team_1_details.logo;
                match.team_1_details.other_photo = BASE_URL_TEAM + match.team_1_details.other_photo;
            }
            if (match.team_2_details) {
                match.team_2_details.logo = BASE_URL_TEAM + match.team_2_details.logo;
                match.team_2_details.other_photo = BASE_URL_TEAM + match.team_2_details.other_photo;
            }
        }

        // console.log(completedMatches[0]._id)

        const { pointSystems } = await getPointSystemsForMatch(completedMatches[0]._id);

        // Step 2: Create a point map for easy access
        const pointMap = {};
        pointSystems.forEach(point => {
            pointMap[point.status] = point.points; // Map status to points
        });


        const data = await JoinContest.aggregate([
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
                    "contest_details.match_id": new mongoose.Types.ObjectId(completedMatches[0]._id),
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
                    totalPoints: { $floor: "$totalPoints" },
                },
            },
        ]);

        // console.log(data[0].totalPoints)

        let highestPoints = 0;

        // Loop through the `data` array to find the highest `totalPoints`
        for (let entry of data) {
            if (entry.totalPoints > highestPoints) {
                highestPoints = entry.totalPoints;
            }
        }

        // console.log(highestPoints)
        // Add the highest points to the completed match data
        for (let match of completedMatches) {
            match.totalPoints = highestPoints; // Add a new field to the match object
        }


        res.status(200).json({
            success: true,
            message: "Display Last Recently Play Match",
            data: completedMatches
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}



exports.matchIdAllDetails = async (req, res) => {
    try {
        let userId = req.user

        let { matchId } = req.query

        let matchData = await JoinContest.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "contests",
                    localField: "contest_id",
                    foreignField: "_id",
                    as: "contest_details"
                }
            },
            {
                $lookup: {
                    from: "matches",
                    localField: "contest_details.match_id",
                    foreignField: "_id",
                    as: "match_details"
                }
            },
            {
                $match: {
                    "contest_details.match_id": new mongoose.Types.ObjectId(matchId)
                }
            },
        ]);


        if (matchData.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Match Data For This User",
                data: []
            })
        }

        let transformedData = matchData.reduce((result, item) => {
            const matchDetail = item.match_details[0];
            const contestDetail = item.contest_details[0];

            if (!result[matchDetail._id]) {
                result[matchDetail._id] = {
                    match_details: matchDetail,
                    contests: []
                };
            }

            result[matchDetail._id].contests.push({
                _id: item._id,
                user_id: item.user_id,
                contest_id: contestDetail._id,
                myTeam_id: item.myTeam_id,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                contest_details: contestDetail
            });

            return result;
        }, {});

        // Convert the result object to an array
        const finalResponse = Object.values(transformedData);

        return res.status(200).json({
            success: true,
            message: "User Join Match Data Successfully",
            data: finalResponse
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error"
        })
    }
}
const mongoose = require("mongoose");
const Groupchat = require("../models/groupchat");
const User = require("../models/user");
const { io } = require("../socket/socket");


exports.insertChat = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        let chat = new Groupchat({
            user_id: userId,
            message: req.body.message
        });
        let result = await chat.save();


        io.emit("globalChat", {
            result,
            userId: userId,
            username: user.name,  // assuming your User model has a username field
            message: result.message,
            createdAt: result.createdAt
        });

        res.status(200).json({
            success: true,
            message: "Chat Inserted Successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



// exports.allDisplayChat = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Define the base URL for profile photos
//         const BASE_URL = "https://batting-api-1.onrender.com/userImage/";


//         // Aggregate to fetch chat messages along with sender details
//         let chatMessages = await Groupchat.aggregate([
//             {
//                 $lookup: {
//                     from: 'users', // Name of the users collection
//                     localField: 'user_id', // Field in Groupchat collection
//                     foreignField: '_id', // Field in users collection
//                     as: 'user_details', // Alias for the joined documents
//                     pipeline: [
//                         {
//                             $project: {
//                                 profile_photo: {
//                                     $concat: [BASE_URL, "$profile_photo"] // Concatenate base URL with profile photo path
//                                 },
//                                 // Include other fields you need from the user collection
//                                 name: 1, // Example of including the user's name
//                                 email: 1,
//                                 mobile: 1,
//                                 dob: 1,
//                                 gender: 1,
//                                 address: 1,
//                                 city: 1,
//                                 pincode: 1,
//                                 state: 1,
//                                 country: 1,
//                                 status: 1,
//                                 unique_id: 1
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     message: 1,
//                     dateAndTime: 1,
//                     createdAt: 1,
//                     user_details: { $arrayElemAt: ['$user_details', 0] }, // Assuming there is only one user associated with each message
//                     date: {
//                         $dateToString: {
//                             format: "%d-%m-%Y", // Format to DD-MM-YYYY
//                             date: "$createdAt"
//                         }
//                     },
//                     time: {
//                         $dateToString: {
//                             format: "%H:%M", // Format to HH:MM
//                             date: "$createdAt"
//                         }
//                     }
//                 }
//             }
//         ]);

//         if (chatMessages.length > 0) {
//             res.status(200).json({
//                 success: true,
//                 message: "Chat messages retrieved successfully",
//                 data: chatMessages
//             });
//         } else {
//             res.status(404).json({
//                 success: false,
//                 message: "No chat messages found"
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


// exports.allDisplayChat = async (req, res) => {
//     try {
//         let userId = req.user;
//         let user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'User not found'
//             });
//         }

//         // Define the base URL for profile photos
//         const BASE_URL = "https://batting-api-1.onrender.com/userImage/";

//         // Aggregate to fetch chat messages along with sender details
//         let chatMessages = await Groupchat.aggregate([
//             {
//                 $lookup: {
//                     from: 'users', // Name of the users collection
//                     localField: 'user_id', // Field in Groupchat collection
//                     foreignField: '_id', // Field in users collection
//                     as: 'user_details', // Alias for the joined documents
//                     pipeline: [
//                         {
//                             $project: {
//                                 profile_photo: {
//                                     $concat: [BASE_URL, "$profile_photo"] // Concatenate base URL with profile photo path
//                                 },
//                                 // Include other fields you need from the user collection
//                                 name: 1, // Example of including the user's name
//                                 email: 1,
//                                 mobile: 1,
//                                 dob: 1,
//                                 gender: 1,
//                                 address: 1,
//                                 city: 1,
//                                 pincode: 1,
//                                 state: 1,
//                                 country: 1,
//                                 status: 1,
//                                 unique_id: 1
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     message: 1,
//                     dateAndTime: 1,
//                     createdAt: 1,
//                     user_details: { $arrayElemAt: ['$user_details', 0] }, // Assuming there is only one user associated with each message
//                     date: {
//                         $dateToString: {
//                             format: "%d-%m-%Y", // Format to DD-MM-YYYY
//                             date: "$createdAt"
//                         }
//                     },
//                     hour: {
//                         $dateToString: {
//                             format: "%H", // Extract 24-hour format hour
//                             date: "$createdAt"
//                         }
//                     },
//                     minute: {
//                         $dateToString: {
//                             format: "%M", // Extract minutes
//                             date: "$createdAt"
//                         }
//                     },
//                     ampm: {
//                         $cond: {
//                             if: { $lt: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } }, 12] },
//                             then: "AM",
//                             else: "PM"
//                         }
//                     },
//                     hour12: {
//                         $mod: [
//                             {
//                                 $add: [
//                                     { $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } },
//                                     {
//                                         $cond: {
//                                             if: { $lte: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } }, 12] },
//                                             then: 0,
//                                             else: -12
//                                         }
//                                     }
//                                 ]
//                             },
//                             12
//                         ]
//                     }
//                 }
//             },
//             {
//                 $addFields: {
//                     time: {
//                         $concat: [
//                             { $toString: { $cond: { if: { $eq: ["$hour12", 0] }, then: 12, else: "$hour12" } } },
//                             ":",
//                             "$minute",
//                             " ",
//                             "$ampm"
//                         ]
//                     }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     message: 1,
//                     dateAndTime:1,
//                     createdAt: 1,
//                     date: 1,
//                     time: 1,
//                     user_details: 1,
//                 }
//             }
//         ]);

//         if (chatMessages.length > 0) {
//             res.status(200).json({
//                 success: true,
//                 message: "Chat messages retrieved successfully",
//                 data: chatMessages
//             });
//         } else {
//             res.status(404).json({
//                 success: false,
//                 message: "No chat messages found"
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
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Extract page and limit from query parameters (default values set for pagination)
        const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 100;  // Default to 10 messages per page if not provided

        // Define the base URL for profile photos
        const BASE_URL = "https://batting-api-1.onrender.com/userImage/";

        // First, count the total number of chat messages for pagination info
        const totalMessages = await Groupchat.countDocuments();

        // Aggregate to fetch chat messages along with sender details
        let chatMessages = await Groupchat.aggregate([
            {
                $lookup: {
                    from: 'users', // Name of the users collection
                    localField: 'user_id', // Field in Groupchat collection
                    foreignField: '_id', // Field in users collection
                    as: 'user_details', // Alias for the joined documents
                    pipeline: [
                        {
                            $project: {
                                profile_photo: {
                                    $concat: [BASE_URL, "$profile_photo"] // Concatenate base URL with profile photo path
                                },
                                // Include other fields you need from the user collection
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
                                unique_id: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    message: 1,
                    dateAndTime: 1,
                    createdAt: 1,
                    user_details: { $arrayElemAt: ['$user_details', 0] }, // Assuming there is only one user associated with each message
                    date: {
                        $dateToString: {
                            format: "%d-%m-%Y", // Format to DD-MM-YYYY
                            date: "$createdAt"
                        }
                    },
                    hour: {
                        $dateToString: {
                            format: "%H", // Extract 24-hour format hour
                            date: "$createdAt"
                        }
                    },
                    minute: {
                        $dateToString: {
                            format: "%M", // Extract minutes
                            date: "$createdAt"
                        }
                    },
                    ampm: {
                        $cond: {
                            if: { $lt: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } }, 12] },
                            then: "AM",
                            else: "PM"
                        }
                    },
                    hour12: {
                        $mod: [
                            {
                                $add: [
                                    { $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } },
                                    {
                                        $cond: {
                                            if: { $lte: [{ $toInt: { $dateToString: { format: "%H", date: "$createdAt" } } }, 12] },
                                            then: 0,
                                            else: -12
                                        }
                                    }
                                ]
                            },
                            12
                        ]
                    }
                }
            },
            {
                $addFields: {
                    time: {
                        $concat: [
                            { $toString: { $cond: { if: { $eq: ["$hour12", 0] }, then: 12, else: "$hour12" } } },
                            ":",
                            "$minute",
                            " ",
                            "$ampm"
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    message: 1,
                    dateAndTime: 1,
                    createdAt: 1,
                    date: 1,
                    time: 1,
                    user_details: 1,
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            // Add Pagination: Skip and Limit stages
            {
                $skip: (page - 1) * limit // Skip messages based on the page number
            },
            {
                $limit: limit // Limit to the number of messages per page
            }
        ]);

        // Calculate total number of pages
        const totalPages = Math.ceil(totalMessages / limit);

        if (chatMessages.length > 0) {
            res.status(200).json({
                success: true,
                message: "Chat messages retrieved successfully",
                data: chatMessages,
                page: page,
                limit: limit,
                totalPages: totalPages,
                totalMessages: totalMessages,

            });
        } else {
            res.status(404).json({
                success: false,
                message: "No chat messages found"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const mongoose = require("mongoose");
const Notification = require("../models/notification");
const User = require("../models/user")
const Admin = require("../models/admin")

exports.insertadminNotification = async (req, res) => {
    try {
        let adminId = req.user
        let admin = await Admin.findById(adminId);
        if (admin.role !== "admin" && admin.role !== "superadmin") {
            return res.status(401).json({
                success: false,
                message: "Admin Not Found!"
            })
        }
        const { title, message, userIds } = req.body

        let notifications = [];

        if (userIds && userIds.length > 0) {
            notifications = userIds.map(userId => ({
                title,
                message,
                user_id: userId,
                user_type: "selected_user",
            }));
        } else {
            notifications.push({
                title,
                message,
                admin_id: adminId,
                user_type: "admin_to_user"
            });
        }

        const Notificationdatainsert = await Notification.insertMany(notifications);
        // let notification = await Notification.create({
        //     admin_id: adminId,
        //     title: title,
        //     message: message,
        //     type: "admin_to_user"
        // })


        if (Notificationdatainsert.length > 0) {
            res.status(200).json({
                success: true,
                message: "Notification Inserted Successfully",
                data: Notificationdatainsert
            })
        } else {
            res.status(400).json({
                success: false,
                message: "Notification Not Inserted!"
            })
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

// exports.insertadminNotification = async (req, res) => {
//     try {
//         let adminId = req.user
//         let admin = await Admin.findById(adminId);
//         if (admin.role !== "admin" && admin.role !== "superadmin") {
//             return res.status(401).json({
//                 success: false,
//                 message: "Admin Not Found!"
//             })
//         }
//         const { title, message } = req.body
//         let notification = await Notification.create({
//             admin_id: adminId,
//             title: title,
//             message: message,
//             type: "admin_to_user"
//         })


//         if (notification) {
//             res.status(200).json({
//                 success: true,
//                 message: "Notification Inserted Successfully",
//                 data: notification
//             })
//         } else {
//             res.status(400).json({
//                 success: false,
//                 message: "Notification Not Inserted!"
//             })
//         }
//     }
//     catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message
//         });
//     }
// }

exports.displayNotification = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        let notificationData = await Notification.aggregate([
            {
                $match: {
                    $or: [
                        { user_id: new mongoose.Types.ObjectId(userId) },
                        { type: "admin_to_user" }
                    ]
                }
            }
        ])
        if (notificationData) {
            res.status(200).json({
                success: true,
                message: "Notification Find Successfully",
                data: notificationData
            })
        } else {
            res.status(402).json({
                success: false,
                message: "Notification Not Found!",
                data: []
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


exports.displayAdminNotifaction = async (req, res) => {
    try {
        let adminId = req.user
        let admin = await Admin.findById(adminId);


        if (admin.role !== "admin" && admin.role !== "superadmin") {
            return res.status(401).json({
                success: false,
                message: "Admin Not Found!"
            })
        }


        let notification = await Notification.aggregate([
            {
                $match: {
                    $or: [
                        { admin_id: new mongoose.Types.ObjectId(adminId) },
                        { type: "admin_to_user" }
                    ]
                }
            }
        ])

        if (notification.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Notification not Found",
                data: []
            })
        }

        return res.status(200).json({
            success: true,
            message: "Notification found successfully",
            data: notification
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

exports.notificationUpdate = async (req, res) => {
    try {

        let userId = req.user
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }

        let updateData = await Notification.updateMany({ user_id: userId }, { $set: { status: 'read' } }, { new: true })

        res.status(200).json({
            success: true,
            message: "Notificatoin status change successfully",
            data: updateData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
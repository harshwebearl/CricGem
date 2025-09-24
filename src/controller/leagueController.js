const mongoose = require('mongoose');
const League = require("../models/league");
const Admin = require("../models/admin");
const User = require('../models/user');
const league = require('../models/league');
const notification = require('../models/notification');
const { getReceiverSocketId, io } = require("../socket/socket");




exports.insertLeague = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let leagueData = new League({
            league_name: req.body.league_name,
            matchType: req.body.matchType,
            end_date: req.body.end_date,
            start_date: req.body.start_date
        });
        let result = await leagueData.save()

        let notificationData = await notification.create({
            admin_id: ["676ea8e218bac679c8a33d8d", "662360442404c14853dc1949"],
            league_id: result._id,
            title: "New League Created",
            message: `A new league ${result.league_name} has been created.`,
        });

        notificationData.admin_id.forEach(adminId => {
            const socketId = getReceiverSocketId(adminId);
            console.log("socketId League::", socketId)
            if (socketId) {
                io.to(socketId).emit('newNotification', notificationData);
            }
        });


        res.status(200).json({
            success: true,
            message: "League Insert Successfully",
            data: result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

exports.editLeague = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { leagueId } = req.query
        console.log(req.query);
        if (!leagueId) {
            return res.status(401).json({
                success: false,
                message: "League Not Found!"
            })
        }
        let updateData = await League.findByIdAndUpdate(leagueId, req.body, { new: true });
        console.log(updateData);
        res.status(200).json({
            success: true,
            message: "League Update Successfully",
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


exports.displayLeague = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let leagueData = await League.find();
        const currentDate = new Date();

        if (leagueData && leagueData.length > 0) {
            // Add a status field to each league
            leagueData = leagueData.map(league => {
                let status = "Expired";
                if (currentDate < new Date(league.start_date)) {
                    status = "Upcoming";
                } else if (currentDate >= new Date(league.start_date) && currentDate <= new Date(league.end_date)) {
                    status = "Ongoing";
                }

                return {
                    ...league._doc, // Spread the original league document properties
                    status // Add the calculated status field
                };
            });

            res.status(200).json({
                success: true,
                message: "Leagues Found Successfully",
                data: leagueData
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Leagues Not Found!"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


exports.displayLeagueByUser = async (req, res) => {
    try {
        let userId = req.user;

        // Find the admin
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        let leagueData = await League.find()
        if (leagueData) {
            res.status(200).json({
                success: true,
                message: "League Find Successfully",
                data: leagueData
            })
        } else {
            res.status(401).json({
                success: false,
                message: "League Not Found!"
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.deleteLeague = async (req, res) => {
    try {
        let adminId = req.user;
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const league_id = req.params.id;
        const deletedLeague = await league.findByIdAndDelete(league_id);
        return res.status(200).json({
            success: true,
            message: "League deleted Successfully",
            data: deletedLeague
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
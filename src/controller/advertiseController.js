const mongoose = require("mongoose");
const Advertise = require("../models/advertise");
const BASE_URL = "https://batting-api-1.onrender.com/ads/";



exports.insertAdvertise = async (req, res) => {
    try {
        let { company_name, photo, start_date, link, end_date, user_count, riverd_coin, status } = req.body

        const advertise = new Advertise({
            company_name,
            photo: req.file.filename,
            start_date,
            end_date,
            riverd_coin,
            user_count,
            link,
            status
        });

        const result = await advertise.save();

        return res.status(200).json({
            success: true,
            message: "Advertise added successfully",
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


exports.getAdvertise = async (req, res) => {
    try {
        const advertise = await Advertise.find();

        for (let i = 0; i < advertise.length; i++) {
            advertise[i].photo = `${BASE_URL}${advertise[i].photo}`
        }

        return res.status(200).json({
            success: true,
            message: "Advertise fetched successfully",
            data: advertise
        })

    } catch (error) {
        res.status(400).json(error);
    }
}

exports.getAdvertiseById = async (req, res) => {
    try {
        const advertiseId = req.query.advertiseId;

        const advertiseData = await Advertise.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(advertiseId) }
            },
            {
                $lookup: {
                    from: "viewads",
                    localField: "_id",
                    foreignField: "adsId",
                    as: "views"
                }
            },
            {
                $unwind: { path: "$views", preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "views.userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $group: {
                    _id: {
                        adId: "$_id",
                        userId: "$userDetails._id"
                    },
                    company_name: { $first: "$company_name" },
                    photo: { $first: "$photo" },
                    start_date: { $first: "$start_date" },
                    end_date: { $first: "$end_date" },
                    riverd_coin: { $first: "$riverd_coin" },
                    user_count: { $first: "$user_count" },
                    link: { $first: "$link" },
                    status: { $first: "$status" },
                    name: { $first: "$userDetails.name" },
                    email: { $first: "$userDetails.email" },
                    mobile: { $first: "$userDetails.mobile" },
                    count: { $sum: 1 },
                    totalViews: { $sum: 1 },
                }
            },
            {
                $group: {
                    _id: "$_id.adId",
                    company_name: { $first: "$company_name" },
                    photo: { $first: "$photo" },
                    start_date: { $first: "$start_date" },
                    end_date: { $first: "$end_date" },
                    riverd_coin: { $first: "$riverd_coin" },
                    user_count: { $first: "$user_count" },
                    link: { $first: "$link" },
                    status: { $first: "$status" },
                    totalViews: { $sum: "$totalViews" },
                    ads_count: {
                        $push: {
                            userId: "$_id.userId",
                            name: "$name",
                            email: "$email",
                            mobile: "$mobile",
                            count: "$count"
                        }
                    }
                }
            }
        ]);

        if (!advertiseData.length) {
            return res.status(404).json({
                success: false,
                message: "Advertise not found"
            });
        }

        // Updating photo URL
        advertiseData[0].photo = `${BASE_URL}${advertiseData[0].photo}`;

        return res.status(200).json({
            success: true,
            message: "Advertise fetched successfully",
            data: advertiseData[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.updateAdvertise = async (req, res) => {
    try {

        let { advertiseId } = req.query;

        let { company_name, photo, start_date, end_date, link, status, riverd_coin, user_count } = req.body

        const advertise = await Advertise.findById(advertiseId);

        if (req.file) {
            advertise.photo = req.file.filename;
        }

        advertise.company_name = company_name;
        advertise.start_date = start_date;
        advertise.end_date = end_date;
        advertise.riverd_coin = riverd_coin;
        advertise.user_count = user_count;
        advertise.link = link;
        advertise.status = status;

        const result = await advertise.save();

        return res.status(200).json({
            success: true,
            message: "Advertise updated successfully",
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

exports.deleteAdvertise = async (req, res) => {
    try {
        const advertiseId = req.query.advertiseId;
        const advertise = await Advertise.findByIdAndDelete(advertiseId);

        return res.status(200).json({
            success: true,
            message: "Advertise deleted successfully",
            data: advertise
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
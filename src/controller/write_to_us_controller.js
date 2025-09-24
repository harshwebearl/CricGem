const mongoose = require("mongoose");
const WriteToUs = require("../models/writeToUs");



exports.create = async (req, res) => {
    try {
        let userId = req.user
        const newTerms = new WriteToUs({
            user_id: userId,
            title: req.body.title,
            description: req.body.description
        });
        await newTerms.save();
        res.status(200).json({
            success: true,
            message: "WriteToUs Added Successfully",
            data: newTerms
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.display = async (req, res) => {
    try {
        const terms = await WriteToUs.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: "user_details",
                    pipeline: [
                        {
                            $project: {
                                password: 0
                            }
                        }
                    ]
                }
            }
        ]);
        res.status(200).json({
            success: true,
            message: "WriteToUs Find Successfully",
            data: terms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.displayUserList = async (req, res) => {
    try {
        let userId = req.user

        const terms = await WriteToUs.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: "user_details",
                    pipeline: [
                        {
                            $project: {
                                password: 0
                            }
                        }
                    ]
                }
            }
        ]);
        res.status(200).json({
            success: true,
            message: "WriteToUs Find Successfully",
            data: terms.reverse()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


exports.displayById = async (req, res) => {
    try {
        // const term = await WriteToUs.findById(req.params.id);
        let _id = req.params.id

        const term = await WriteToUs.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(_id)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: "user_details",
                    pipeline: [
                        {
                            $project: {
                                password: 0
                            }
                        }
                    ]
                }
            }
        ]);

        if (!term) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "WriteToUs Find Successfully",
            data: term
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.update = async (req, res) => {
    try {
        const updatedTerm = await WriteToUs.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                description: req.body.description
            },
            { new: true }
        );
        if (!updatedTerm) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "WriteToUs update Successfully",
            data: updatedTerm
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateStatus = async (req, res) => {
    try {
        const updatedTerm = await WriteToUs.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true }
        );
        if (!updatedTerm) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "WriteToUs update Successfully",
            data: updatedTerm
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.delete = async (req, res) => {
    try {
        const deletedTerm = await WriteToUs.findByIdAndDelete(req.params.id);
        if (!deletedTerm) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "WriteToUs delete Successfully",
            data: deletedTerm
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
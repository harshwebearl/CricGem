const AboutUs = require('../models/about_us');

// Create About Us
exports.addAboutUs = async (req, res) => {
    try {
        let { about_us } = req.body;

        if (about_us === "") {
            return res.status(400).json({
                success: false,
                message: "About us is required"
            })
        }

        let createData = new AboutUs({
            about_us
        });

        let result = await createData.save();

        res.status(200).json({
            success: true,
            message: "About Us added successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Get About Us
exports.getAboutUs = async (req, res) => {
    try {
        let results = await AboutUs.find();

        res.status(200).json({
            success: true,
            message: "About Us fetched successfully",
            data: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


exports.updateAboutUs = async (req, res) => {
    try {
        const { id } = req.params;
        const { about_us } = req.body;

        if (about_us === "") {
            return res.status(400).json({
                success: false,
                message: "About us is required"
            })
        }

        const result = await AboutUs.findByIdAndUpdate(
            id,
            { about_us },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "About Us entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "About Us updated successfully",
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
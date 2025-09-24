const CommunityGuidelines = require('../models/community_guidelines');

// Create Community Guidelines
exports.addCommunityGuidelines = async (req, res) => {
    try {
        let { community_guidelines } = req.body;

        let createData = new CommunityGuidelines({
            community_guidelines
        });

        let result = await createData.save();

        res.status(200).json({
            success: true,
            message: "Community Guidelines added successfully",
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

// Get Community Guidelines
exports.getCommunityGuidelines = async (req, res) => {
    try {
        let results = await CommunityGuidelines.find();

        res.status(200).json({
            success: true,
            message: "Community Guidelines fetched successfully",
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


// Update Community Guidelines
exports.updateCommunityGuidelines = async (req, res) => {
    try {
        const { id } = req.params;
        const { community_guidelines } = req.body;

        const result = await CommunityGuidelines.findByIdAndUpdate(
            id,
            { community_guidelines },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Community Guidelines entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Community Guidelines updated successfully",
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

const HelpAndSupport = require('../models/help_and_support');

// Create Help and Support Entry
exports.addHelpAndSupport = async (req, res) => {
    try {
        const { question, answer } = req.body;

        const createData = new HelpAndSupport({
            question,
            answer
        });

        const result = await createData.save();

        res.status(200).json({
            success: true,
            message: "Help and Support entry added successfully",
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

// Get All Help and Support Entries
exports.getHelpAndSupport = async (req, res) => {
    try {
        const results = await HelpAndSupport.find();

        res.status(200).json({
            success: true,
            message: "Help and Support entries fetched successfully",
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

// Update Help and Support Entry
exports.updateHelpAndSupport = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer } = req.body;

        const result = await HelpAndSupport.findByIdAndUpdate(
            id,
            { question, answer },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Help and Support entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Help and Support entry updated successfully",
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

// Delete Help and Support Entry
exports.deleteHelpAndSupport = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await HelpAndSupport.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Help and Support entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Help and Support entry deleted successfully",
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

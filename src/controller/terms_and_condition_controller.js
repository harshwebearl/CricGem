const mongoose = require("mongoose");
const TermsAndCondition = require("../models/terms_and_condition");





exports.create = async (req, res) => {
    try {
        const newTerms = new TermsAndCondition({
            terms_and_condition: req.body.terms_and_condition
        });
        await newTerms.save();
        res.status(200).json({
            success: true,
            message: "TermsAndCondition Added Successfully",
            data: newTerms
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.display = async (req, res) => {
    try {
        const terms = await TermsAndCondition.find();
        res.status(200).json({
            success: true,
            message: "TermsAndCondition Find Successfully",
            data: terms
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


exports.displayById = async (req, res) => {
    try {
        const term = await TermsAndCondition.findById(req.params.id);
        if (!term) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "TermsAndCondition Find Successfully",
            data: term
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.update = async (req, res) => {
    try {
        const updatedTerm = await TermsAndCondition.findByIdAndUpdate(
            req.params.id,
            { terms_and_condition: req.body.terms_and_condition },
            { new: true }
        );
        if (!updatedTerm) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "TermsAndCondition update Successfully",
            data: updatedTerm
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.delete = async (req, res) => {
    try {
        const deletedTerm = await TermsAndCondition.findByIdAndDelete(req.params.id);
        if (!deletedTerm) return res.status(404).json({ message: "Term not found" });
        res.status(200).json({
            success: true,
            message: "TermsAndCondition delete Successfully",
            data: deletedTerm
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
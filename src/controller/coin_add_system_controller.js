const mongoose = require("mongoose");
const CoinAddSystem = require("../models/coin_add_system");


exports.addCoinAddSystem = async (req, res) => {
    try {
        let { coin_add_from, coin_value, date_and_time } = req.body

        if (coin_add_from === "referral" || coin_add_from === "registration") {
            const existingEntry = await CoinAddSystem.findOne({ coin_add_from });
            if (existingEntry) {
                return res.status(400).json({
                    success: false,
                    message: `${coin_add_from} entry already exists. You cannot add it again.`
                });
            }
        }

        const coinAddSystem = new CoinAddSystem({
            coin_add_from,
            coin_value,
            date_and_time
        });

        const result = await coinAddSystem.save();

        return res.status(200).json({
            success: true,
            message: "Coin Add System added successfully",
            data: result
        })

    } catch (error) {
        res.status(400).send(error);
    }
};

exports.getCoinAddSystem = async (req, res) => {
    try {
        const coinAddSystem = await CoinAddSystem.find();

        return res.status(200).json({
            success: true,
            message: "Coin Add System fetched successfully",
            data: coinAddSystem
        })

    } catch (error) {
        res.status(400).send(error);
    }
};

exports.getCoinAddSystemById = async (req, res) => {
    try {
        const coinId = req.query.coinId;
        const coinAddSystem = await CoinAddSystem.findById(coinId);

        return res.status(200).json({
            success: true,
            message: "Coin Add System fetched successfully",
            data: coinAddSystem
        })

    } catch (error) {
        res.status(400).send(error);
    }
}

exports.updateCoinAddSystem = async (req, res) => {
    try {

        let { coinId } = req.query;

        let { coin_add_from, start_date, end_date, coin_value, date_and_time } = req.body

        const coinAddSystem = await CoinAddSystem.findById(coinId);

        if (coinAddSystem) {
            coinAddSystem.coin_add_from = coin_add_from;
            coinAddSystem.coin_value = coin_value;
            coinAddSystem.date_and_time = date_and_time;

            const result = await coinAddSystem.save();

            return res.status(200).json({
                success: true,
                message: "Coin Add System updated successfully",
                data: result
            })
        }

    } catch (error) {
        res.status(400).send(error);
    }
}

exports.deleteCoinAddSystem = async (req, res) => {
    try {
        let { coinId } = req.query;
        const coinAddSystem = await CoinAddSystem.findByIdAndDelete(coinId);

        return res.status(200).json({
            success: true,
            message: "Coin Add System deleted successfully",
            data: coinAddSystem
        })

    } catch (error) {
        res.status(400).send(error);
    }
}
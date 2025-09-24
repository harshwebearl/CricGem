const Transaction = require("../models/transaction");
const User = require("../models/user");
const Wallet = require("../models/wallet");
const Document = require('../models/document');
const withdraw = require("../models/withdrow_details");
const Notification = require("../models/notification");
const { getReceiverSocketId, io } = require("../socket/socket");
const CoinAddSystem = require("../models/coin_add_system");
const CoinAddDetail = require("../models/coin_add_detail");
const CgCoin = require("../models/cg_coin");

// Route1 Show Funds
exports.showFunds = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        let wallet = await Wallet.findOne({ user_id: userId });

        let cgCoins = await CgCoin.findOne({ user_id: userId });

        wallet.winnings = 10;
        wallet.bonus = 10;
        res.status(200).json({
            success: true,
            message: "transaction Add Successfully",
            data: wallet,
            cgCoin: cgCoins
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Route2 Add Funds
exports.addFunds = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        const { amount } = req.body;

        if (amount > 100000) {
            return res.status(400).josn({
                success: false,
                message: "Amount Can't more then 1lakh"
            })
        }


        const transaction = await Transaction.create({
            user_id: userId,
            amount: amount,
            payment_mode: "upi",
            payment_type: "add_wallet",
            status: "success",
            approval: true
        });
        // const transactionId = transaction._id;
        if (
            transaction.user_id == userId &&
            transaction.status == "success"
            // &&  !transaction.approval
        ) {
            let wallet = await Wallet.findOne({ user_id: userId });
            let newFunds = wallet.funds;
            if (transaction.payment_type == "add_wallet") {
                newFunds = wallet.funds + transaction.amount;
            } else {
                return res.status(200).json({
                    success: true,
                    message: "No add funds transaction on this transactionId",
                    data: Null,
                });
            }

            // transaction = await Transaction.findByIdAndUpdate(transactionId, {
            //     approval: true,
            // });
            updatedWallet = await Wallet.findByIdAndUpdate(wallet._id, {
                funds: newFunds,
            }, { new: true });

            let notification = await Notification.create({
                user_id: userId,
                title: "Funds Added",
                message: `₹${amount} has been successfully added to your wallet. Your new balance is ₹${newFunds}.`,
            });

            const socketId = getReceiverSocketId(userId);
            console.log("socketId match start::", socketId)
            if (socketId) {
                io.to(socketId).emit('newNotification', notification);
            }


            return res.status(200).json({
                success: true,
                message: "transaction Add Successfully",
                data: updatedWallet,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction Failed",
            data: transaction
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
// Route3 Withdraw

exports.withdrawFunds = async (req, res) => {
    try {
        let userId = req.user;
        let user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!",
            });
        }

        // Check if the user's documents are approved
        let documents = await Document.findOne({ user_id: userId });
        if (!documents) {
            return res.status(400).json({
                success: false,
                message: "Documents not found!",
            });
        }

        if (documents.adhaar_card_status !== 'approved' || documents.pan_card_status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: "Your documents are not uploaded for withdrawal",
            });
        }

        const { amount, UPI_ID } = req.body;
        let wallet = await Wallet.findOne({ user_id: userId });
        let currFunds = wallet.funds;

        if (amount < 200) {
            return res.status(200).json({
                success: true,
                message: "Minimum withdrawal amount is 200",
                data: amount,
            });
        } else if (amount > 5000) {
            return res.status(200).json({
                success: true,
                message: "Maximum withdrawal amount is 5000",
                data: amount,
            });
        } else if (currFunds < amount) {
            return res.status(200).json({
                success: true,
                message: "You do not have sufficient balance",
                data: currFunds,
            });
        }

        const transaction = await Transaction.create({
            user_id: userId,
            amount: amount,
            payment_mode: "upi",
            payment_type: "withdraw",
            status: "pending",
            approval: true,
        });

        if (transaction.user_id == userId && transaction.status == "pending") {
            let wallet = await Wallet.findOne({ user_id: userId });
            let newFunds = wallet.funds;
            if (transaction.payment_type == "withdraw") {
                newFunds = wallet.funds - transaction.amount;
            }

            const updatedWallet = await Wallet.findByIdAndUpdate(wallet._id, {
                funds: newFunds,
            }, { new: true });


            let withdraw_details = await withdraw.create({
                transactionSchema_id: transaction._id,
                UPI_ID,
                status: 'pending'
            })

            let notification = await Notification.create({
                user_id: userId,
                title: "Withdrawal Request Initiated",
                message: `Your withdrawal request of ₹${amount} to UPI ID ${UPI_ID} has been successfully submitted and is pending approval.`,
            });

            const socketId = getReceiverSocketId(userId);
            console.log("socketId match start::", socketId)
            if (socketId) {
                io.to(socketId).emit('newNotification', notification);
            }

            return res.status(200).json({
                success: true,
                message: "Withdraw Request Sent Successfully",
                data: updatedWallet
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction failed",
            data: null,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

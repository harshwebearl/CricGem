const mongoose = require("mongoose");
const withdraw = require("../models/withdrow_details");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");



exports.insertWithdraw = async (req, res) => {
    try {
        let userId = req.user

        let { transactionSchema_id, UPI_ID, status } = req.body

        let newWithdrawData = new withdraw({
            transactionSchema_id,
            UPI_ID,
            status
        });

        let result = await newWithdrawData.save();

        res.status(200).json({
            success: true,
            message: "Withdraw Request Sent Successfully",
            data: result
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}



exports.displayWithdraw = async (req, res) => {
    try {
        let id = req.params.id
        let withdrawData = await withdraw.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id)
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: 'transactionSchema_id',
                    foreignField: '_id',
                    as: "transaction_details",
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'transaction_details.user_id',
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

        if (!withdrawData) {
            return res.status(200).josn({
                success: false,
                message: "Withdraw Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Withdraw Display Successfully",
            data: withdrawData
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


exports.withdrawDiplayAll = async (req, res) => {
    try {
        let withdrawData = await withdraw.aggregate([
            {
                $lookup: {
                    from: 'transactions',
                    localField: 'transactionSchema_id',
                    foreignField: '_id',
                    as: "transaction_details"
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'transaction_details.user_id',
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
            },
            {
                $sort: {
                    createdAt: -1
                }
            }
        ]);

        if (!withdrawData) {
            return res.status(200).josn({
                success: false,
                message: "Withdraw Not Found!"
            });
        }

        res.status(200).json({
            success: true,
            message: "Withdraw Display Successfully",
            data: withdrawData
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.updateWithdraw = async (req, res) => {
    try {
        let id = req.params.id;

        // Update withdrawal details
        let update = {
            status: req.body.status,
            transaction_id: req.body.transaction_id
        };

        // Find the withdrawal request by ID
        let updateData = await withdraw.findByIdAndUpdate(id, update, { new: true });

        let transactionUpdate = await Transaction.findOne({ _id: updateData.transactionSchema_id });
        transactionUpdate.status = "success";
        await transactionUpdate.save();

        if (!updateData) {
            return res.status(400).json({
                success: false,
                message: "Withdraw request not found!"
            });
        }

        // Check if the withdrawal is rejected
        if (req.body.status === "reject") {
            let transactionUpdate = await Transaction.findOne({ _id: updateData.transactionSchema_id });

            if (!transactionUpdate) {
                return res.status(400).json({
                    success: false,
                    message: "Transaction not found!"
                });
            }

            let transactionAmount = transactionUpdate.amount;

            // Find the user's wallet
            let wallet = await Wallet.findOne({ user_id: transactionUpdate.user_id });

            if (!wallet) {
                return res.status(400).json({
                    success: false,
                    message: "User wallet not found!"
                });
            }

            // Refund the amount to the user's wallet
            wallet.funds += transactionAmount;
            const updatedWallet = await wallet.save();

            // Update the transaction status to "failed"
            transactionUpdate.status = "fail";
            await transactionUpdate.save();

            return res.status(200).json({
                success: true,
                message: "Withdraw request rejected, amount refunded, and transaction marked as failed",
                data: updatedWallet
            });
        }

        // If the status is not "rejected", return a success response
        return res.status(200).json({
            success: true,
            message: "Withdraw and Transaction Updated Successfully",
            data: updateData
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};



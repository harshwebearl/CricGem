const mongoose = require('mongoose');
const ManualPayment = require('../models/manual_payment');
const User = require('../models/user');
const Wallet = require('../models/wallet'); // Import the Wallet model
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');
const { getReceiverSocketId, io } = require('../socket/socket');
const BASE_URL = "https://batting-api-1.onrender.com/userImage/";
const moment = require('moment');


exports.createManualPayment = async (req, res) => {
    try {

        let userId = req.user
        const { amount, transaction_id, payment_mode } = req.body;

        // Validate the request body
        if (!amount) {
            return res.status(400).json({ message: 'Amount are required' });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const lastPayment = await ManualPayment.findOne({ user_id: userId, status: 'pending' })
            .sort({ createdAt: -1 }); // Assuming createdAt is a timestamp field

        if (lastPayment) {
            const fifteenMinutesAgo = moment().subtract(15, 'minutes');
            const lastPaymentTime = moment(lastPayment.createdAt);

            if (lastPaymentTime.isAfter(fifteenMinutesAgo)) {
                const remaining = moment.duration(lastPaymentTime.diff(fifteenMinutesAgo));
                return res.status(400).json({
                    message: `You can only make a payment every 15 minutes.`
                });
            }
        }

        // Create a new manual payment record
        const newPayment = new ManualPayment({
            user_id: userId,
            amount,
            transaction_id,
            payment_mode
        });

        await newPayment.save();

        return res.status(200).json({ message: 'Manual payment created successfully', data: newPayment });

    } catch (error) {
        console.error('Error creating manual payment:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}


exports.updatePaymentStatus = async (req, res) => {
    try {
        const payment_id = req.query.payment_id;
        const { status, transaction_id, amount } = req.body;

        // Validate the request body
        if (!status) {
            return res.status(400).json({ message: 'Status are required' });
        }

        // Find the manual payment record by ID
        const payment = await ManualPayment.findById(payment_id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Update the payment status
        payment.status = status;
        payment.transaction_id = transaction_id;
        payment.amount = amount;
        await payment.save();

        // If the status is 'completed', add the amount to the user's wallet
        if (status.toLowerCase() === 'completed') {
            const wallet = await Wallet.findOne({ user_id: payment.user_id });

            if (wallet) {
                wallet.funds += amount; // Add the payment amount to the wallet funds
                await wallet.save();
            } else {
                // If no wallet exists for the user, create a new one
                await Wallet.create({
                    user_id: payment.user_id,
                    funds: amount,
                    fundsUtilized: 0,
                    processedContests: []
                });
            }

            // Create a transaction entry
            await Transaction.create({
                user_id: payment.user_id,
                amount: amount,
                payment_mode: payment.payment_mode,
                payment_type: 'manual_payment',
                status: 'success',
                approval: true
            });

            // Send a notification to the user
            let notification = await Notification.create({
                user_id: payment.user_id,
                title: 'Payment Approved',
                message: `Your payment of amount ₹${payment.amount} has been successfully approved and added to your wallet.`,
                type: 'payment'
            });

            const socketId = getReceiverSocketId(payment.user_id);
            if (socketId) {
                io.to(socketId).emit('newNotification', notification);
            }
        }

        return res.status(200).json({ message: 'Payment status updated successfully', data: payment });
    } catch (error) {
        console.error('Error updating payment status:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}


exports.displatAdminPayment = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query; // Pagination parameters
        const skip = (page - 1) * limit; // Calculate the number of records to skip

        // Fetch manual payments with pagination
        const payments = await ManualPayment.aggregate([
            {
                $lookup: {
                    from: 'users', // The name of the User collection
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user_details',
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                email: 1,
                                mobile: 1,
                                profile_photo: 1 // Include any other fields you need
                            }
                        },
                    ]
                }
            },
            {
                $unwind: '$user_details' // Unwind the user details array
            },
            {
                $sort: { createdAt: -1 } // Sort by creation date in descending order
            },
            {
                $skip: skip // Skip the specified number of records
            },
            {
                $limit: parseInt(limit) // Limit the number of records
            }
        ]);

        for (let i = 0; i < payments.length; i++) {
            payments[i].user_details.profile_photo = BASE_URL + payments[i].user_details.profile_photo;
        }

        if (payments.length === 0) {
            return res.status(404).json({ message: 'No manual payments found' });
        }

        return res.status(200).json({ message: 'Manual payments fetched successfully', data: payments });

    } catch (error) {
        console.error('Error fetching manual payments:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

exports.displayById = async (req, res) => {
    try {
        const payment_id = req.query.payment_id; // Get the payment ID from the request

        // Fetch manual payment by ID
        const payment = await ManualPayment.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(payment_id) } // Match the payment ID
            },
            {
                $lookup: {
                    from: 'users', // The name of the User collection
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user_details'
                }
            },
            {
                $unwind: '$user_details' // Unwind the user details array
            }
        ]);

        for (let i = 0; i < payment.length; i++) {
            payment[i].user_details.profile_photo = BASE_URL + payment[i].user_details.profile_photo;
        }


        if (!payment) {
            return res.status(404).json({ message: 'Manual payment not found' });
        }

        return res.status(200).json({ message: 'Manual payment fetched successfully', data: paymentData });


    } catch (error) {
        console.error('Error fetching manual payment:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

exports.displayUserPayment = async (req, res) => {
    try {
        const userId = req.user; // Get the user ID from the request

        // Fetch manual payments for the user
        const payments = await ManualPayment.find({ user_id: userId })

        if (payments.length === 0) {
            return res.status(404).json({ message: 'No manual payments found for this user' });
        }

        return res.status(200).json({ message: 'Manual payments fetched successfully', data: payments });

    } catch (error) {
        console.error('Error fetching manual payments:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
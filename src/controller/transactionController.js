const Transaction = require("../models/transaction");
const User = require("../models/user");


exports.addTransaction = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }
        let { amount, payment_mode, payment_type, status } = req.body
        let transactionData = new Transaction({
            user_id: userId,
            amount,
            payment_mode,
            payment_type,
            status
        });
        let result = await transactionData.save();
        res.status(200).json({
            success: true,
            message: "transaction Add Successfully",
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

exports.showTransaction = async(req,res)=>{
    try{

        let userId = req.user
        let user = await User.findById(userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }

        const transactions = await Transaction.find({user_id: userId});

        res.status(200).json({
            success: true,
            message: "transaction shown Successfully",
            data: transactions
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

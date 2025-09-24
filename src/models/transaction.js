const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const transactionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: false
    },
    cgCoin_amount: {
        type: Number,
        required: false,
        defualt: 0
    },
    payment_mode: {
        type: String,
        required: true
    },
    payment_type: {
        type: String,
        enum: ['add_wallet', 'withdraw', "contest_fee", "winning_amount", "cg_coin_deduction", "manual_payment"],
    },
    status: {
        type: String,
        enum: ['success', 'fail', 'pending'],
        default: 'success'
    },
    approval: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("transaction", transactionSchema)
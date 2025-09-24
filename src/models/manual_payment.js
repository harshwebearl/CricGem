const mongoose = require('mongoose');

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const ManualPaymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date_time: {
        type: Date,
        default: getISTTime(),
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
        required: false
    },
    transaction_id: {
        type: String,
        required: false,
        unique: true
    },
    payment_mode: {
        type: String,
        enum: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
        required: false
    }
}, {
    timestamps: {

        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('ManualPayment', ManualPaymentSchema);
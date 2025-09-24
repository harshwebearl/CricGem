
const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const withdrawSchema = new mongoose.Schema({
    transactionSchema_id: {
        type: mongoose.Schema.Types.ObjectId,
    },
    transaction_id: {
        type: String
    },
    UPI_ID: {
        type: String
    },
    status: {
        type: String,
        default: 'pending'
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("withdraw_details", withdrawSchema)
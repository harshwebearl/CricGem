const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const walletSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    funds: {
        type: Number,
        required: true,
        default: 0
    },
    fundsUtilized: {
        type: Number,
        required: true,
        default: 0
    },
    processedContests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest'
    }],
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("wallet", walletSchema)
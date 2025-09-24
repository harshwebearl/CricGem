const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const joinContestSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to a User schema if you have one
        required: true
    },
    contest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest', // Reference to a User schema if you have one
        required: true
    },
    myTeam_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'myTeam', // Reference to a User schema if you have one
        required: true
    }],
    use_cgCoin: {
        type: Number,
        required: true
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("joinContest", joinContestSchema)   
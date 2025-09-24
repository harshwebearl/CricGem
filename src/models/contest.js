const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const contestSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    contest_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest-Type'
    },
    price_pool: {
        type: Number,
        required: true
    },
    entry_fees: {
        type: Number,
        required: true
    },
    total_participant: {
        type: Number,
        required: true
    },
    max_team_per_user: {
        type: Number,
        required: true
    },
    profit: {
        type: Number,
        required: true
    },
    date_time: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String
    } 
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('Contest', contestSchema)
const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const matchSchema = new mongoose.Schema({
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'league'
    },
    team_1_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    team_2_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    match_name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    vanue: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    isStarted: {
        type: Boolean,
        default: false
    },
    isComplated: {
        type: Boolean,
        default: false
    },
    overs: {
        type: Number,
        required: true
    },
    innings: {
        type: Number,
        required: true
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('Match', matchSchema)
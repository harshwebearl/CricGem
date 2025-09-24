const mongoose = require("mongoose")

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const SuperOverSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    team1: {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        runs: {
            type: Number,
        },
        wicket: {
            type: Number,
        },
        overs: {
            type: String,
        },
    },
    team2: {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        runs: {
            type: Number,
        },
        wicket: {
            type: Number,
        },
        overs: {
            type: String,
        }
    },
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});


const SuperOver = mongoose.model("superover", SuperOverSchema);

module.exports = SuperOver
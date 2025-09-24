const mongoose = require("mongoose");
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const MatchScoreSchema = new Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    toss: {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        choice: {
            type: String,
        }
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
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const MatchScore = mongoose.model('matchscore', MatchScoreSchema);
module.exports = MatchScore;


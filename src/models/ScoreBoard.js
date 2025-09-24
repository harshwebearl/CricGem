const mongoose = require("mongoose");
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const ScoreBoardSchema = new Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
    },
    inning: {
        type: Number,
    },

    battingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
    },
    ballingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
    },
    batting: [
        {
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "player",
            },
            runs: {
                type: Number,
                default: 0
            },
            balls: {
                type: Number,
                default: 0
            },
            fours: {
                type: Number,
                default: 0
            },
            sixes: {
                type: Number,
                default: 0
            },
            isOut: {
                type: Boolean,
                default: false
            },
            strikeRate: {
                type: Number,
                default: 0
            },
            outBy: {
                status: {
                    type: String,
                },
                ballerId: {
                    type: mongoose.Schema.Types.ObjectId
                },
                secondaryPlayerId: {
                    type: mongoose.Schema.Types.ObjectId
                },
                assistingPlayerId: { // New field for the second player's ID
                    type: mongoose.Schema.Types.ObjectId
                },
                runOutType: { // Field to indicate the type of run-out
                    type: String,
                }
            }
        },
    ],
    extras: {
        nb: {
            type: Number,
            default: 0
        },
        wide: {
            type: Number,
            default: 0
        },
        legByes: {  // New field for leg byes
            type: Number,
            default: 0
        },
        byes: {  // New field for byes
            type: Number,
            default: 0
        },
        penalty: {  // New field for byes
            type: Number,
            default: 0
        },
    },
    balling: [
        {
            playerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "player",
            },
            runs: {
                type: Number,
                default: 0
            },
            wickets: {
                type: Number,
                default: 0
            },
            balls: {
                type: Number,
                default: 0
            },
            overs: {
                type: String,  // Change to String to hold "overs.balls"
                default: "0.0"
            },
            previousRuns: {
                type: Number,
                default: 0
            },
            economy: {
                type: Number,
                default: 0
            },
            maidenOvers: {
                type: Number,
                default: 0
            }
        },
    ],
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const ScoreBoard = mongoose.model("scoreboard", ScoreBoardSchema);
module.exports = ScoreBoard;

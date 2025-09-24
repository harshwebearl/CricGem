const mongoose = require("mongoose")
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const ScoreCardSchema = new Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    inning: {
        type: Number
    },
    battingTeam: {
        type: mongoose.Types.ObjectId,
        ref: 'Team'
    },
    batsman1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    batsman2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    outId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    ballerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    secondaryPlayerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    assistingPlayerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    runOutType: {
        type: String,
    },
    currBall: {
        type: String
    },
    run: {
        type: Number
    },
    status: {
        type: String,
        // enum:['run', 'four', 'six', 'wicket', 'catch', 'lbw', 'bowled' , 'stumping', 'runout', 'nb', 'wide', 'nbout', 'lb', overthrow]
    },
    overthrowBoundary: {
        type: Number
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const ScoreCard = mongoose.model('scorecard', ScoreCardSchema);
module.exports = ScoreCard;
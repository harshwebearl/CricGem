const mongoose = require("mongoose")
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const PlayerPointSchema = new Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    points: {
        type: Number,
        default: 0
    },
    leagueId: {
        type: mongoose.Schema.Types.ObjectId
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
})

const PlayerPoint = mongoose.model('player_point', PlayerPointSchema);
module.exports = PlayerPoint;

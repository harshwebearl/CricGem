const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const teamPlayerSchema = new mongoose.Schema({
    team_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    player_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    c_or_vc: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "active"
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("teamPlayer", teamPlayerSchema)
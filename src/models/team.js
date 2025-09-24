const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const teamSchema = new mongoose.Schema({
    team_name: {
        type: String,
        required: true
    },
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "league"
    },
    logo: {
        type: String,
        required: true
    },
    other_photo: {
        type: String,
        required: true
    },
    short_name: {
        type: String,
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        default: null
    },
    vice_captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        default: null
    },
    color_code: {
        type: String,
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('Team', teamSchema)
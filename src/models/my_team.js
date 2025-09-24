const mongoose = require('mongoose');

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const teamSchema = new mongoose.Schema({
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match', // Reference to a Match schema if you have one
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to a User schema if you have one
        required: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player', // Reference to a Player schema if you have one
        required: true
    }],
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        required: true
    },
    vicecaptain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player',
        required: true
    },
    date_time: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('myTeam', teamSchema);

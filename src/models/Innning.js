const mongoose = require('mongoose')
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const InningSchema = new Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    battingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    ballingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },

}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
})

const Inning = mongoose.model('inning', InningSchema);
module.exports = Inning
const mongoose = require("mongoose");
function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const leagueSchema = new mongoose.Schema({
    league_name: {
        type: String,
        required: true
    },
    matchType: {
        type: mongoose.Schema.Types.ObjectId,
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },

}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("league", leagueSchema)
const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const contestSchema = new mongoose.Schema({
    contest_type: {
        type: String,
        required: true
    },
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});


module.exports = mongoose.model('Contest-Type', contestSchema);
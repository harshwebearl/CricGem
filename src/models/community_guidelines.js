const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const community_guidelines_schema = new mongoose.Schema({
    community_guidelines: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});


module.exports = mongoose.model("community_guidelines", community_guidelines_schema)
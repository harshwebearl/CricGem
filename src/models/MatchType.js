const mongoose = require("mongoose");
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const MatchTypeSchema = new Schema({
    name: {
        type: String,
    },
    pointType: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId },
            name: { type: String },
        },
    ],
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const MatchType = mongoose.model('match_type', MatchTypeSchema);
module.exports = MatchType;

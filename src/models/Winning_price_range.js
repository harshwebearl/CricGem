const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const winningPriceSchema = new mongoose.Schema({
    wpr_no: {
        type: Number,
        default: 1,
        required: true
    },
    range: [
        {
            type: String,
            required: true
        }
    ]
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});


module.exports = mongoose.model("winningPriceRange", winningPriceSchema)
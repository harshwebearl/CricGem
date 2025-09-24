const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const winningPriceSchema = new mongoose.Schema({
    contest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest'
    },
    range_price: [
        {
            range_no:
            {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ]
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});


module.exports = mongoose.model('WinningPrice', winningPriceSchema)
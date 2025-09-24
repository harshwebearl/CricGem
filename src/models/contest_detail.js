const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const contestDetailsSchema = new mongoose.Schema({
    contest_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest'
    },
    rankes: [{
        range: {
            type: [Number],
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        percent: {
            type: Number,
            required: true
        }
    }],
    date_time: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('contest_details', contestDetailsSchema)
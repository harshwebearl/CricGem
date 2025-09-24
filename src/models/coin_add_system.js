const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const coinAddSystemSchema = new mongoose.Schema({
    coin_add_from: {
        type: String,
        enum: ['registration', 'advertise', 'referral'],
        required: true
    },
    // start_date: {
    //     type: Date,
    //     required: true
    // },
    // end_date: {
    //     type: Date,
    //     required: true
    // },
    coin_value: {
        type: Number,
        required: true
    },
    date_and_time: {
        type: Date,
        default: getISTTime()
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("coin_add_system", coinAddSystemSchema);    
const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const advertiseSchema = new mongoose.Schema({
    company_name: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    riverd_coin: {
        type: Number,
        required: true
    },
    user_count: {
        type: Number,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: {

        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("advertise", advertiseSchema);
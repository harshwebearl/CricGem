
const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const coinAddDetailSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    coin_add_from: {
        type: String,
        enum: ['registration', 'advertise', 'referral'],
        required: true
    },
    coin_value: {
        type: Number,
        required: true
    },
    date_and_time: {
        type: Date,
        default: getISTTime()
    },
    referal_no:{
        type: String
    }
},
    {
        timestamps: {
            currentTime: () => getISTTime()
        }
    });

module.exports = mongoose.model("coin_add_detail", coinAddDetailSchema);
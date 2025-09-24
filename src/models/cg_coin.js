const mongoose = require("mongoose");


function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const cgCoinSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    coin_value: {
        type: Number,
        required: true
    }
},
    {
        timestamps: {
            currentTime: () => getISTTime()
        }
    })

module.exports = mongoose.model("cg_coin", cgCoinSchema);   
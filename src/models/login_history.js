const mongoose = require('mongoose');

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}


const loginHistorySchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    online_date: {
        type: Date,
        // required: true
    },
    online_time: {
        type: String
    },
    offline_date: {
        type: Date
    },
    offline_time: {
        type: String
    }
}, {
    timestamps: {

        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
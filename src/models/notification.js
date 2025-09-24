const mongoose = require("mongoose");
function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    match_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },
    admin_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }],
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "unread"
    },
    dateAndTime: {
        type: Date,
        default: getISTTime()
    },
    type: {
        type: String,
        required: false
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model("notification", notificationSchema)
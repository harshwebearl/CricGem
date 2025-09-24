const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const documentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adhaar_card_front_photo: {
        type: String,
        required: true
    },
    adhaar_card_back_photo: {
        type: String,
        required: true
    },
    adhaar_card_status: {
        type: String,
        enum: ['pending', 'reject', 'approved'],
        default: 'pending'
    },
    adhaar_card_num: {
        type: Number,
        required: true
    },
    pan_card_front_photo: {
        type: String,
        required: true
    },
    pan_card_back_photo: {
        type: String,
        required: true
    },
    pan_card_status: {
        type: String,
        enum: ['pending', 'reject', 'approved'],
        default: 'pending'
    },
    pan_card_num: {
        type: String,
        required: true
    },
    adhaar_card_reason: {
        type: String,
        // required: true
    },
    pan_card_reason: {
        type: String,
        // required: true
    },
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('Document', documentSchema)
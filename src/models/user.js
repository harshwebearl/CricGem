const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const userSchema = new mongoose.Schema({
    unique_id: {
        type: String,
        required: true
    },
    referral_code: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    profile_photo: {
        type: String,
        default: "dummy_photo.webp",

    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    dateAndTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('User', userSchema)
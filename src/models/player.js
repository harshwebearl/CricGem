const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const playerSchema = new mongoose.Schema({
    player_name: {
        type: String,
        required: true
    },
    player_photo: {
        type: String,
        required: true,
        default: "defualt_image.png"
    },
    age: {
        type: Number,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    birth_date: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    bat_type: {
        type: String,
        required: true
    },
    bowl_type: {
        type: String,
        required: true
    }
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

module.exports = mongoose.model('player', playerSchema);
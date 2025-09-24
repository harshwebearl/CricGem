const mongoose = require('mongoose');
const { Schema } = mongoose;

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const PointSystemSchema = new Schema({
    matchType: {
        type: mongoose.Schema.Types.ObjectId,
    },
    pointType: {
        type: mongoose.Schema.Types.ObjectId,
    },
    pointFor: {
        type: mongoose.Schema.Types.ObjectId,
    },
    points: {
        type: Number
    }

}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const PointSystem = mongoose.model('point_system', PointSystemSchema);
module.exports = PointSystem;
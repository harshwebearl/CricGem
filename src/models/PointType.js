const mongoose = require('mongoose');

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const pointTypeSchema = new mongoose.Schema({
    point_type_name: {
        type: String,
        required: true 
    },
    point_for: [{
        type: mongoose.Schema.Types.ObjectId,
    }]
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const PointType = mongoose.model('point_type', pointTypeSchema);
module.exports = PointType;

const mongoose = require("mongoose")

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const viewAdsSchema = new mongoose.Schema({
    adsId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
}, {
    timestamps: {
        currentTime: () => getISTTime()
    }
});

const ViewAds = mongoose.model('ViewAds', viewAdsSchema);

module.exports = ViewAds;
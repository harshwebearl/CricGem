const mongoose = require("mongoose");

function getISTTime() {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC +5:30
    const now = new Date();
    const istTime = new Date(now.getTime() + istOffset);
    return istTime;
}

const PointForSchema = new mongoose.Schema(
    {
        point_for_name: {
            type: String,
        },
        status:{
            type:String,
        }
    },
    {
        timestamps: {
            currentTime: () => getISTTime(),
        },
    }
);

const PointFor = mongoose.model("point_for", PointForSchema);
module.exports = PointFor;

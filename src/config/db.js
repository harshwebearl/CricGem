const mongoose = require("mongoose");
require('dotenv').config()
const DATABASE_URL = process.env.DATABASE_URL

module.exports = mongoose.connect(DATABASE_URL)
    .then(() => {
        console.log("Database Connected Successfully");
    }).catch((error) => {
        throw error
    })
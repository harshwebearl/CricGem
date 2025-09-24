const jwt = require("jsonwebtoken");
require('dotenv').config();
const { ADMIN_SECRET, USER_SECRET } = process.env

const optional = {
    expiresIn: "365d"
}


// async function adminJwtToken({ _id }) {
//     try {
//         const payload = { _id };
//         const token = jwt.sign(payload, ADMIN_SECRET, optional);
//         return { token: token };

//     } catch (error) {
//         return { error: true }
//     }
// }

async function adminJwtToken({ _id, role }) {
    try {
        const payload = { _id, role }; // Include role in the payload
        const token = jwt.sign(payload, ADMIN_SECRET, optional);
        return { token: token };
    } catch (error) {
        return { error: true };
    }
}


async function userJwtToken({ _id }) {
    try {
        const payload = { _id };
        const token = jwt.sign(payload, USER_SECRET, optional);
        return { token: token };

    } catch (error) {
        return { error: true }
    }
}


module.exports = { adminJwtToken, userJwtToken }
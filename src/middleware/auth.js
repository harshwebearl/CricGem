const jwt = require("jsonwebtoken");
require('dotenv').config();
const { ADMIN_SECRET, USER_SECRET } = process.env




// const adminVerifyToken = async (req, res, next) => {
//     let token = req.headers.authorization
//     if (!token) {
//         return res.status(400).json({
//             success: false,
//             message: "Token Not Provided"
//         })
//     }
//     try {
//         let decoded = jwt.verify(token, ADMIN_SECRET)
//         req.user = decoded._id
//     } catch (error) {
//         return res.status(400).json({
//             success: false,
//             message: "Token Invalid"
//         })
//     }
//     return next()
// }

const adminVerifyToken = async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Token Not Provided"
        });
    }
    try {
        let decoded = jwt.verify(token, ADMIN_SECRET);
        req.user = decoded._id;
        req.role = decoded.role; // Store the role in request for further checks

        // Optionally, check for superadmin role in middleware
        // if (req.role !== 'superadmin') {
        //     return res.status(403).json({
        //         success: false,
        //         message: "You do not have sufficient permissions"
        //     });
        // }
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Token Invalid"
        });
    }
    return next();
};


const userVerifyToken = async (req, res, next) => {
    let token = req.headers.authorization
    if (!token) {
        return res.status(400).json({
            success: false,
            message: "Token Not Provided"
        })
    }
    try {
        let decoded = jwt.verify(token, USER_SECRET)
        req.user = decoded._id
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Token Invalid"
        })
    }
    return next()
}

const verifyToken = (req, res, next) => {
    let token = req.headers.authorization

    if (!token) {
        return res.status(400).json({ success: false, message: "Token not provided" });
    }

    try {
        let decode = jwt.verify(token, ADMIN_SECRET);
        req.user = decode._id;
    } catch (adminError) {
        try {
            decode = jwt.verify(token, USER_SECRET);
            req.user = decode._id;
        }
        catch (sellerError) {
            return res.status(400).json({ success: false, message: "token invalid" });
        }
    }

    return next();
}

module.exports = { adminVerifyToken, userVerifyToken, verifyToken }
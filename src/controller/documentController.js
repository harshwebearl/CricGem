const mongoose = require("mongoose");
const Document = require("../models/document");
const User = require("../models/user");
const BASE_URL = 'https://batting-api-1.onrender.com/document/'
const BASE_URL_USER = 'https://batting-api-1.onrender.com/userImage/'
const Admin = require("../models/admin")


exports.addDocument = async (req, res) => {
    try {
        let userId = req.user
        let user = await User.findById(userId)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            })
        }

        let userDocument = await Document.findOne({ user_id: userId })

        if (userDocument) {
            return res.status(400).json({
                success: false,
                message: "This User Document already Uploaded!"
            })
        }

        const adhaarCardFrontPhoto = req.files['adhaar_card_front_photo'][0].filename;
        const adhaarCardBackPhoto = req.files['adhaar_card_back_photo'][0].filename;
        const panCardFrontPhoto = req.files['pan_card_front_photo'][0].filename;
        const panCardBackPhoto = req.files['pan_card_back_photo'][0].filename;

        let { adhaar_card_num, pan_card_num, adhaar_card_reason, pan_card_reason } = req.body
        let documentData = new Document({
            user_id: userId,
            adhaar_card_front_photo: adhaarCardFrontPhoto,
            adhaar_card_back_photo: adhaarCardBackPhoto,
            adhaar_card_num,
            pan_card_front_photo: panCardFrontPhoto,
            pan_card_back_photo: panCardBackPhoto,
            pan_card_num,
            adhaar_card_reason,
            pan_card_reason
        });
        let result = await documentData.save();
        res.status(200).json({
            success: true,
            message: "Documents uploaded successfully",
            data: result
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.updateDocumentDetails = async (req, res) => {
    try {
        const userId = req.user; // User ID from authentication token (assuming it's set)
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        // Check if the user already has a document in the database
        let document = await Document.findOne({ user_id: userId });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found!"
            });
        }

        // if (document.adhaar_card_status === 'approved') {
        //     if (req.files['adhaar_card_front_photo'] || req.files['adhaar_card_back_photo'] || req.body.adhaar_card_num) {
        //         return res.status(403).json({
        //             success: false,
        //             message: "Adhaar card details cannot be modified once approved!"
        //         });
        //     }
        // }

        // // Check if Pan Card is approved and prevent changes to its details
        // if (document.pan_card_status === 'approved') {
        //     if (req.files['pan_card_front_photo'] || req.files['pan_card_back_photo'] || req.body.pan_card_num) {
        //         return res.status(403).json({
        //             success: false,
        //             message: "Pan card details cannot be modified once approved!"
        //         });
        //     }
        // }

        // Prepare the updated document data
        let { adhaar_card_num, pan_card_num, adhaar_card_reason, pan_card_reason } = req.body;

        // File uploads (Only if new files are provided)
        if (req.files) {
            if (req.files['adhaar_card_front_photo']) {
                document.adhaar_card_front_photo = req.files['adhaar_card_front_photo'][0].filename;
            }
            if (req.files['adhaar_card_back_photo']) {
                document.adhaar_card_back_photo = req.files['adhaar_card_back_photo'][0].filename;
            }
            if (req.files['pan_card_front_photo']) {
                document.pan_card_front_photo = req.files['pan_card_front_photo'][0].filename;
            }
            if (req.files['pan_card_back_photo']) {
                document.pan_card_back_photo = req.files['pan_card_back_photo'][0].filename;
            }
        }

        // Update document fields
        document.adhaar_card_num = adhaar_card_num || document.adhaar_card_num;
        document.pan_card_num = pan_card_num || document.pan_card_num;
        document.adhaar_card_reason = adhaar_card_reason || document.adhaar_card_reason;
        document.pan_card_reason = pan_card_reason || document.pan_card_reason;

        // Save the updated document
        const updatedDocument = await document.save();


        // Add base URL to the photo file paths
        const documentData = {
            ...updatedDocument.toObject(),
            adhaar_card_front_photo: `${BASE_URL}${updatedDocument.adhaar_card_front_photo}`,
            adhaar_card_back_photo: `${BASE_URL}${updatedDocument.adhaar_card_back_photo}`,
            pan_card_front_photo: `${BASE_URL}${updatedDocument.pan_card_front_photo}`,
            pan_card_back_photo: `${BASE_URL}${updatedDocument.pan_card_back_photo}`
        };

        res.status(200).json({
            success: true,
            message: "Document details updated successfully",
            data: documentData
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


// Fetch document details for the user
exports.getDocumentDetails = async (req, res) => {
    try {
        const userId = req.user; // User ID from authentication token (assuming it's set)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User Not Found!"
            });
        }

        // Fetch documents related to the user
        const document = await Document.findOne({ user_id: userId });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Documents not found!"
            });
        }


        // Add base URL to the photo file paths
        const documentData = {
            ...document.toObject(),
            adhaar_card_front_photo: `${BASE_URL}${document.adhaar_card_front_photo}`,
            adhaar_card_back_photo: `${BASE_URL}${document.adhaar_card_back_photo}`,
            pan_card_front_photo: `${BASE_URL}${document.pan_card_front_photo}`,
            pan_card_back_photo: `${BASE_URL}${document.pan_card_back_photo}`
        };

        res.status(200).json({
            success: true,
            message: "Document details fetched successfully",
            data: documentData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.getDocumentByAdmin = async (req, res) => {
    try {
        const adminId = req.user; // User ID from authentication token (assuming it's set)
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Admin Not Found!"
            });
        }

        let { userId } = req.query
        const document = await Document.findOne({ user_id: userId });
        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Documents not found!"
            });
        }


        // Add base URL to the photo file paths
        const documentData = {
            ...document.toObject(),
            adhaar_card_front_photo: `${BASE_URL}${document.adhaar_card_front_photo}`,
            adhaar_card_back_photo: `${BASE_URL}${document.adhaar_card_back_photo}`,
            pan_card_front_photo: `${BASE_URL}${document.pan_card_front_photo}`,
            pan_card_back_photo: `${BASE_URL}${document.pan_card_back_photo}`
        };

        res.status(200).json({
            success: true,
            message: "Document details fetched successfully",
            data: documentData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


exports.updateStatus = async (req, res) => {
    try {
        let adminId = req.user
        let admin = await Admin.findById(adminId)
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        let { documentId } = req.query
        let document = await Document.findById(documentId);
        if (!document) {
            return res.status(401).json({
                success: false,
                message: "Document Not Found!"
            })
        }
        let data = {
            adhaar_card_status: req.body.adhaar_card_status,
            pan_card_status: req.body.pan_card_status,
            adhaar_card_reason: req.body.adhaar_card_reason,
            pan_card_reason: req.body.pan_card_reason
        }
        let updateData = await Document.findByIdAndUpdate(documentId, data, { new: true });
        res.status(200).json({
            success: true,
            message: "Document Status Update Successfully",
            data: updateData
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


exports.documentList = async (req, res) => {
    try {
        let adminId = req.user
        let admin = await Admin.findById(adminId)
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        let document = await Document.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: "user_id",
                    foreignField: '_id',
                    as: "user",
                    pipeline: [
                        {
                            $project: {
                                password: 0
                            }
                        }
                    ]
                }
            },

        ]);

        if (!document) {
            return res.status(400).json({
                success: false,
                message: "Document Not Found"
            })
        }

        document = document.map(document => {
            document.adhaar_card_front_photo = `${BASE_URL}${document.adhaar_card_front_photo}`;
            document.adhaar_card_back_photo = `${BASE_URL}${document.adhaar_card_back_photo}`;
            document.pan_card_front_photo = `${BASE_URL}${document.pan_card_front_photo}`;
            document.pan_card_back_photo = `${BASE_URL}${document.pan_card_back_photo}`;

            if (document.user && document.user.length > 0) {
                document.user[0].profile_photo = `${BASE_URL_USER}${document.user[0].profile_photo}`;
            }

            return document;
        });


        return res.status(200).json({
            success: true,
            message: "Document found successfully",
            data: document
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}
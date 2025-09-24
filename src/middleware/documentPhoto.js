const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/upload/document'); // Directory where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use original file name
    }
});

const upload = multer({ storage: storage });

const document = upload.fields([
    { name: 'adhaar_card_front_photo', maxCount: 1 },
    { name: 'adhaar_card_back_photo', maxCount: 1 },
    { name: 'pan_card_front_photo', maxCount: 1 },
    { name: 'pan_card_back_photo', maxCount: 1 }
])

module.exports = document
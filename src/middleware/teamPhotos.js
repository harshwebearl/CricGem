const multer = require("multer")

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/upload/teamPhoto'); // Directory where files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use original file name
    }
});

const upload = multer({ storage: storage });

const teamPhoto = upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'other_photo', maxCount: 1 }
])

module.exports = teamPhoto
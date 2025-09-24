const router = require("express").Router();
const playerController = require("../controller/playerController");
const { adminVerifyToken, userVerifyToken } = require("../middleware/auth");
const upload = require("../middleware/playerPhoto");





router.post("/createPlayer", adminVerifyToken, upload, playerController.createPlayer);
router.get("/detailsList", adminVerifyToken, playerController.playerDisplayList);
router.get("/displayDetails", adminVerifyToken, playerController.displayDetails);
router.put("/update", adminVerifyToken, upload, playerController.editPlayer)


router.get('/getplayers', userVerifyToken, playerController.selectPlayersDetails);



module.exports = router
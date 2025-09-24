const router = require("express").Router();
const groupchatController = require("../controller/groupchatController");
const { userVerifyToken } = require("../middleware/auth");




router.post("/insertChat", userVerifyToken, groupchatController.insertChat);
router.get("/displayChat", userVerifyToken, groupchatController.allDisplayChat)


module.exports = router
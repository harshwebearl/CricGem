const router = require("express").Router();
const notificationController = require("../controller/notificationController");
const { userVerifyToken, adminVerifyToken } = require("../middleware/auth");

router.post("/insertadminNotification", adminVerifyToken, notificationController.insertadminNotification);
router.get("/displayNotification", userVerifyToken, notificationController.displayNotification);
router.get("/displayAdminNotification", adminVerifyToken, notificationController.displayAdminNotifaction)
router.put("/update", userVerifyToken, notificationController.notificationUpdate)



module.exports = router
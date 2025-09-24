const router = require("express").Router()
const contestTypeController = require("../controller/contestTypeController")
const { adminVerifyToken } = require("../middleware/auth")




router.post("/create", adminVerifyToken, contestTypeController.createContestType);
router.put("/update", adminVerifyToken, contestTypeController.editContestType);
router.get("/display", adminVerifyToken, contestTypeController.displayContestType);
router.delete("/delete", adminVerifyToken, contestTypeController.deleteContestType);



module.exports = router
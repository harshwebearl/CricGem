const router = require("express").Router()
const contest_detail_controller = require("../controller/contest_details_controller");
const { adminVerifyToken } = require("../middleware/auth");





router.post("/insert", adminVerifyToken, contest_detail_controller.createContestDetails);
router.put("/update", adminVerifyToken, contest_detail_controller.updateContestDetails)
router.get("/displayList", adminVerifyToken, contest_detail_controller.displayContestList)
router.get("/displayDetails", adminVerifyToken, contest_detail_controller.displayContestDetails)
router.delete("/delete", adminVerifyToken, contest_detail_controller.deleteContestDisplayDetails)


module.exports = router
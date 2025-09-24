const router = require("express").Router();
const contestController = require("../controller/contestController");
const { adminVerifyToken, userVerifyToken } = require("../middleware/auth");



router.post("/create", adminVerifyToken, contestController.createContest);
router.put("/update", adminVerifyToken, contestController.editContest);
router.get("/displayList", adminVerifyToken, contestController.contestList);
router.get("/displayDetails", adminVerifyToken, contestController.displayContestWithDetails)
router.delete("/delete", adminVerifyToken, contestController.deleteContest)

router.put("/statusChange", adminVerifyToken, contestController.changeContestStatus)

// User side
router.get('/display', userVerifyToken, contestController.displayContestDetails);

router.get("/winner", userVerifyToken, contestController.winnerDetails)



module.exports = router
const router = require("express").Router();
const { userVerifyToken } = require("../middleware/auth");
const joinContestController = require("../controller/joinContestController");



router.post("/joinContest", userVerifyToken, joinContestController.createJoinContest);
router.get("/displayData", userVerifyToken, joinContestController.displayJoinContest)
router.get("/displayList", userVerifyToken, joinContestController.displayAllContestList)
router.get("/mycontests", userVerifyToken, joinContestController.myContests)


module.exports = router
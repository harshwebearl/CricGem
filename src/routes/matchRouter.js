const router = require("express").Router();
const matchController = require("../controller/matchController");
const { adminVerifyToken, userVerifyToken, verifyToken } = require("../middleware/auth");


router.post("/insert", adminVerifyToken, matchController.insertMatch)
router.get("/displayList", adminVerifyToken, matchController.displayList)
router.get("/matchDetails", adminVerifyToken, matchController.displayMatchDetails)
router.put("/update", adminVerifyToken, matchController.editMatch)
router.get("/displaycontestList", verifyToken, matchController.displayContestsByMatchIdAdmin)
router.get("/displayListByLeague", adminVerifyToken, matchController.displayListByLeague)
router.put("/start/:id", adminVerifyToken, matchController.startMatch)

router.get("/displayListByUser", userVerifyToken, matchController.displayListByUser)
router.get("/displayListByLeagueId", userVerifyToken, matchController.displayListByLeagueId)
router.get("/displaycontests", userVerifyToken, matchController.displayContestsByMatchId)
router.put("/complate", adminVerifyToken, matchController.complateMatch)

router.get("/matchList", adminVerifyToken, matchController.matchList)

module.exports = router
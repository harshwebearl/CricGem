const router = require("express").Router();
const myTeamController = require("../controller/myTeamController");
const { userVerifyToken, adminVerifyToken } = require("../middleware/auth");



router.post("/my_team", userVerifyToken, myTeamController.createMyteam);
router.put("/update-team", userVerifyToken, myTeamController.updateTeam)
router.get("/displayList", userVerifyToken, myTeamController.displayList)
router.get("/displayDetails", userVerifyToken, myTeamController.displayDetails)
router.get("/displayDetail", adminVerifyToken, myTeamController.displayDetail)
router.get("/displaybymatch", userVerifyToken, myTeamController.displayListByMatchId)
router.get("/displayall", userVerifyToken, myTeamController.displayAllTeams)
// router.get("/displayAllTeamByMatchId", userVerifyToken, myTeamController.displayAllListByMatchId)

router.delete("/delete", userVerifyToken, myTeamController.deleteMyTeam);



module.exports = router
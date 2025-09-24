const router = require("express").Router();
const teamPlayerController = require("../controller/teamPlayerController");
const { adminVerifyToken } = require("../middleware/auth");




router.post("/create", adminVerifyToken, teamPlayerController.createTeamPlayer)
router.post("/insert", adminVerifyToken, teamPlayerController.insertTeamPlayer)
router.get("/display", adminVerifyToken, teamPlayerController.displayList)
router.get("/display/:id", adminVerifyToken, teamPlayerController.displayListByTeamId)
router.put("/update", adminVerifyToken, teamPlayerController.editTeamPlayer)
router.get("/displayDetails", adminVerifyToken, teamPlayerController.displayDetails)
router.delete("/removePlayer", adminVerifyToken, teamPlayerController.removePlayerId)
router.get("/displayAllTeamPlayer", adminVerifyToken, teamPlayerController.teamIdByAllPlayerDisplay)


module.exports = router
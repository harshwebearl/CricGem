const router = require("express").Router();
const teamController = require("../controller/teamController");
const { adminVerifyToken } = require("../middleware/auth");
const teamPhoto = require("../middleware/teamPhotos");



router.post("/createTeam", adminVerifyToken, teamPhoto, teamController.createTeam);
// router.post("/createTeam", adminVerifyToken, teamPhoto, teamController.createTeam);
router.get("/displayList", adminVerifyToken, teamController.displayList)
router.get("/displayList/:id", adminVerifyToken, teamController.displayListByLeagueId)
router.get("/displayDetails", adminVerifyToken, teamController.displayDetails)
router.put("/updateTeam", adminVerifyToken, teamPhoto, teamController.editTeam)
router.put("/update_c_and_vc", adminVerifyToken, teamController.editCaptainAndViceCaptain )


module.exports = router

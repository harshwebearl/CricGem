const express = require("express");
const router = express.Router();
const { adminVerifyToken, userVerifyToken } = require("../middleware/auth");
const playerPointsController = require("../controller/playerPointsController");


router.get("/league", adminVerifyToken, playerPointsController.getPlayerPointLeague);
router.get("/match", adminVerifyToken, playerPointsController.getPlayerPointForMatch);
router.get("/myteam", playerPointsController.getPlayerPointInMyTeam)
router.get("/playerPointByMatch", userVerifyToken, playerPointsController.getPlayerPointInMatchIdByUser)
router.get("/playerPointByTeam", userVerifyToken, playerPointsController.getPlayerPointInTeamIdByUser)
router.get("/playerPoint", playerPointsController.playerPoint)
module.exports = router;
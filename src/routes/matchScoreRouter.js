const express = require("express");
const { adminVerifyToken } = require("../middleware/auth");
const router = express.Router();
const matchScoreController = require('../controller/matchScoreController')

router.get("/:id", adminVerifyToken, matchScoreController.getMatchScore);
router.get("/super_over/:id", adminVerifyToken, matchScoreController.getMatchSuperOverScore);
router.get("/secound_super_over/:id", adminVerifyToken, matchScoreController.getMatchSecoundSuperOverScore);

module.exports = router
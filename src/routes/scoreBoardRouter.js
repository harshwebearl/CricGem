const express = require('express');
const scoreBoardController = require('../controller/scoreBoardController');
const { adminVerifyToken, userVerifyToken } = require('../middleware/auth');
const router = express.Router();


router.get('/:id', adminVerifyToken, scoreBoardController.getScoreBoard)
router.get('/getScoreByMatchId/:id', adminVerifyToken, scoreBoardController.getScoreBoardByMatchId)
router.post('/create/:id', adminVerifyToken, scoreBoardController.createNewScoreBoard)
router.post('/super_over/:id', adminVerifyToken, scoreBoardController.createNewSuperOverScoreBoard)
router.post('/secound_inning_super_over/:id', adminVerifyToken, scoreBoardController.createNewSecoundInningSuperOverScoreBoard)
router.post('/secound_super_over/:id', adminVerifyToken, scoreBoardController.createNewSecoundSuperOverScoreBoard)
router.post('/secound_super_over_secound_inning/:id', adminVerifyToken, scoreBoardController.createNewSecoundInningSecoundSuperOverScoreBoard)
router.get('/last/:id', adminVerifyToken, scoreBoardController.getLastScoreBoard)

router.get("/userScore/:id", userVerifyToken, scoreBoardController.getUserScoreBoard)

module.exports = router;

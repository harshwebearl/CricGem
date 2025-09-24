const express = require("express");
const { adminVerifyToken } = require("../middleware/auth");
const router = express.Router();
const scoreCardController = require("../controller/scoreCardController");

router.post('/', adminVerifyToken, scoreCardController.addScore);
router.post('/super_over', adminVerifyToken, scoreCardController.superOverScore);
router.post('/secound_super_over', adminVerifyToken, scoreCardController.secoundSuperOverScore);
router.get('/:id', adminVerifyToken, scoreCardController.displayScoresByMatch);
router.get('/lastscore/:id', adminVerifyToken, scoreCardController.displayLastScore);
router.get('/test/:id', scoreCardController.test);
module.exports = router;
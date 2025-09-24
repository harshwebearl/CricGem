const express = require('express');
const router = express.Router();
const { adminVerifyToken } = require('../middleware/auth');
const matchTypeController = require("../controller/matchTypeController")



router.get('/', adminVerifyToken, matchTypeController.getAllMatchType);
router.post('/', adminVerifyToken, matchTypeController.createMatchType);
router.get('/:id', adminVerifyToken, matchTypeController.getMatchTypeById)
router.put('/:id', adminVerifyToken, matchTypeController.updateMatchType);
router.delete('/:id', adminVerifyToken, matchTypeController.deleteMatchType)
module.exports = router;    
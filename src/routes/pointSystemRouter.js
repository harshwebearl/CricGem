const express = require('express');
const { adminVerifyToken, verifyToken } = require('../middleware/auth');
const router = express.Router();
const pointSystemController = require('../controller/pointSystemController');

router.get('/', adminVerifyToken, pointSystemController.getAllPointSystem)
router.get('/get', adminVerifyToken, pointSystemController.getAllPointSystemByPointTypeAndMatchType)
router.post('/', adminVerifyToken, pointSystemController.createPointSystem)
router.put('/:id', adminVerifyToken, pointSystemController.updatePointSystem)
router.delete('/:id', adminVerifyToken, pointSystemController.deletePointSystem);
router.get("/point", pointSystemController.playerPoint)

module.exports = router;
const express = require("express");
const { adminVerifyToken } = require("../middleware/auth");
const router = express.Router();
const pointForController = require('../controller/pointForController');

router.get('/', adminVerifyToken, pointForController.displayAll);
router.post('/', adminVerifyToken, pointForController.insertPointType);
router.put('/:id', adminVerifyToken, pointForController.updatePoint);
router.delete('/:id', adminVerifyToken, pointForController.deletePoint);

module.exports = router;
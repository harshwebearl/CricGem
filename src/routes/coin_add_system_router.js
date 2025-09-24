const express = require('express');
const coinAddSystemController = require('../controller/coin_add_system_controller');

const router = express.Router();

router.post('/add', coinAddSystemController.addCoinAddSystem);
router.get('/display', coinAddSystemController.getCoinAddSystem);
router.get('/displayById', coinAddSystemController.getCoinAddSystemById);
router.put('/update', coinAddSystemController.updateCoinAddSystem);
router.delete('/delete', coinAddSystemController.deleteCoinAddSystem);

module.exports = router;
const express = require('express');
const advertiseController = require('../controller/advertiseController');
const upload = require('../middleware/advertisePhoto');

const router = express.Router();

router.post('/insert', upload, advertiseController.insertAdvertise);
router.get('/get', advertiseController.getAdvertise);
router.get('/getById', advertiseController.getAdvertiseById);
router.put('/update', upload, advertiseController.updateAdvertise);
router.delete('/delete', advertiseController.deleteAdvertise);

module.exports = router;
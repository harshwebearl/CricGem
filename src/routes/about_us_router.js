const express = require('express');
const router = express.Router();
const aboutUsController = require('../controller/about_us_controller');

router.post('/create', aboutUsController.addAboutUs);
router.get('/display', aboutUsController.getAboutUs);
router.put('/update/:id', aboutUsController.updateAboutUs);

module.exports = router;

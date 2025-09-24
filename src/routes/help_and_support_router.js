const express = require('express');
const router = express.Router();
const helpAndSupportController = require('../controller/help_and_support_controller');

router.post('/create', helpAndSupportController.addHelpAndSupport);
router.get('/display', helpAndSupportController.getHelpAndSupport);
router.put('/update/:id', helpAndSupportController.updateHelpAndSupport);
router.delete('/delete/:id', helpAndSupportController.deleteHelpAndSupport);

module.exports = router;

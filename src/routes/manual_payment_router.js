const express = require('express');
const manualPaymentController = require('../controller/manual_payment_controller');

// filepath: d:/RAKESH WEBEARL/CRICGEM_BECKEND/src/routes/manual_payment_router.js
const router = express.Router();

const { userVerifyToken, adminVerifyToken } = require("../middleware/auth");

// Route to create a manual payment
router.post('/create', userVerifyToken, manualPaymentController.createManualPayment);

// Route to update payment status
router.put('/update-status', manualPaymentController.updatePaymentStatus);

// Route to display admin payments with pagination
router.get('/admin-payments', manualPaymentController.displatAdminPayment);

// Route to display user-specific payments
router.get('/user-payments', manualPaymentController.displayUserPayment);

router.get('/displayId', manualPaymentController.displayById);

module.exports = router;
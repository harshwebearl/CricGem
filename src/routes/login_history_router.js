const router = require('express').Router();
const loginHistoryController = require('../controller/login_history_controller');
const { userVerifyToken } = require("../middleware/auth");


router.post('/splash_screen', userVerifyToken, loginHistoryController.slpash_screen);
router.put('/update_login_history', userVerifyToken, loginHistoryController.updateLoginHistory);

router.get('/login_history', loginHistoryController.displayAdminLoginHistory);

router.post("/add_coin", userVerifyToken, loginHistoryController.addCoinByAds);

module.exports = router;
// Compare this snippet from src/controller/app_update_controller.js:
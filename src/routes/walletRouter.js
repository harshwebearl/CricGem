const { userVerifyToken } = require("../middleware/auth")
const walletController = require("../controller/walletController")

const router = require("express").Router()

router.get('/display', userVerifyToken, walletController.showFunds);
// router.post('/add/:id', userVerifyToken, walletController.addFunds);
router.post('/add', userVerifyToken, walletController.addFunds);
router.post('/withdraw', userVerifyToken, walletController.withdrawFunds);

module.exports = router
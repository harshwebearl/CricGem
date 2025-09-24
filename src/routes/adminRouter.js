const router = require("express").Router();
const adminController = require("../controller/adminController");
const { adminVerifyToken } = require("../middleware/auth")


router.post('/admin_login', adminController.adminLogin);

router.put("/changePassword", adminVerifyToken, adminController.changePassword)

router.get("/find_all_user", adminVerifyToken, adminController.allUserDisplay)
router.get("/findUser", adminVerifyToken, adminController.userDetails)
router.get("/displayChat", adminVerifyToken, adminController.allDisplayChat)
router.get("/displayAllWallet", adminVerifyToken, adminController.displayAllWallet)

router.get("/deshboard", adminVerifyToken, adminController.adminDeshboard)


module.exports = router
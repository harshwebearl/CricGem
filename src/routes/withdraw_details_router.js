const router = require("express").Router();
const withdrawController = require("../controller/withdrow_details_controller");
const { verifyToken, userVerifyToken, adminVerifyToken } = require("../middleware/auth");



router.post("/request_withdraw", userVerifyToken, withdrawController.insertWithdraw);
router.put("/update_status/:id", adminVerifyToken, withdrawController.updateWithdraw);
router.get("display_withdraw/:id", verifyToken, withdrawController.displayWithdraw);
router.get("/displayAllWithdraw", verifyToken, withdrawController.withdrawDiplayAll);



module.exports = router
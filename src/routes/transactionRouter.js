const router = require("express").Router();
const transactionController = require("../controller/transactionController");
const { userVerifyToken } = require("../middleware/auth");


router.post("/addtransaction", userVerifyToken, transactionController.addTransaction);
router.get("/show", userVerifyToken, transactionController.showTransaction)

module.exports = router
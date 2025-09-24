const router = require("express").Router();
const winningPriceController = require("../controller/winning_price_controller");
const { adminVerifyToken } = require("../middleware/auth");



router.post("/create", adminVerifyToken, winningPriceController.createWinnigPrice);
router.get("/displayDetails", adminVerifyToken, winningPriceController.displayWinningPrice)
router.get("/displayList", adminVerifyToken, winningPriceController.displayList)
router.delete("/delete", adminVerifyToken, winningPriceController.deleteWinningPrice);
router.put("/update",adminVerifyToken,winningPriceController.editWinningPrice)

module.exports = router
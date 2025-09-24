const router = require("express").Router();
const winningPriceRangeController = require("../controller/Winning_price_range_controller");
const { adminVerifyToken } = require("../middleware/auth")



router.post("/create", adminVerifyToken, winningPriceRangeController.createWinningPrice);
router.get("/display", adminVerifyToken, winningPriceRangeController.displayWinningPriceRangeById);
router.get("/displayAll", adminVerifyToken, winningPriceRangeController.displayAllRangePrice);
router.put("/update", adminVerifyToken, winningPriceRangeController.updateWinningPriceRange);
router.delete("/delete", adminVerifyToken, winningPriceRangeController.deletepriceRange)


module.exports = router
const router = require("express").Router();
const leaguaController = require("../controller/leagueController");
const { adminVerifyToken, userVerifyToken } = require("../middleware/auth");



router.post("/insertLeague", adminVerifyToken, leaguaController.insertLeague);
router.put("/update", adminVerifyToken, leaguaController.editLeague)
router.get("/displayList", adminVerifyToken, leaguaController.displayLeague)
router.delete("/delete/:id", adminVerifyToken, leaguaController.deleteLeague)

//User
router.get("/displayListByUser", userVerifyToken, leaguaController.displayLeagueByUser)


module.exports = router
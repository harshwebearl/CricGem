const router = require("express").Router();
const referAndEarnController = require("../controller/refer & earn_controller");




router.post("/create", referAndEarnController.addReferAndEarn);
router.get("/display", referAndEarnController.getReferAndEarns);
router.put("/update/:id", referAndEarnController.updateReferAndEarn);
router.delete("/delete/:id", referAndEarnController.deleteReferAndEarn);





module.exports = router
const router = require("express").Router();
const WriteToUsController = require("../controller/write_to_us_controller");
const { userVerifyToken } = require("../middleware/auth");



router.post("/create", userVerifyToken, WriteToUsController.create);
router.get("/display", WriteToUsController.display);
router.get("/displayByUser", userVerifyToken, WriteToUsController.displayUserList);
router.get("/displayById/:id", WriteToUsController.displayById);
router.put("/update/:id", WriteToUsController.update);
router.put("/updateStatus/:id", WriteToUsController.updateStatus);
router.delete("/delete/:id", WriteToUsController.delete);



module.exports = router
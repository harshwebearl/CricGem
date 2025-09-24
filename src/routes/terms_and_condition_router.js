const router = require("express").Router();
const TermsAndCondition = require("../controller/terms_and_condition_controller");



router.post("/create", TermsAndCondition.create);
router.get("/display", TermsAndCondition.display);
router.get("/displayById/:id", TermsAndCondition.displayById);
router.put("/update/:id", TermsAndCondition.update);
router.delete("/delete/:id", TermsAndCondition.delete);



module.exports = router
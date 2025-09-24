const router = require("express").Router();
const userController = require("../controller/userController");
const { userVerifyToken } = require("../middleware/auth");
const upload = require("../middleware/userImage");



router.post("/add_user", userController.userInsert)
router.post("/user_login", userController.UserLogin)
router.put("/updateUser", upload, userVerifyToken, userController.editUser)
router.get("/userDetails", userVerifyToken, userController.profileDisplay)
router.post("/changePassword", userVerifyToken, userController.changePassword)

router.get("/displayAllContest", userVerifyToken, userController.displayAllContest)

router.get("/desbord_details", userVerifyToken, userController.desbord_details_by_user)

router.put("/forget_password", userController.forgetPassword)

router.get("/userMatches", userVerifyToken, userController.getUserMatches)

router.get("/lastRecentlyMatchUser", userVerifyToken, userController.lastRecentlyPlayerdMatchByUser);

router.get("/matchDetails", userVerifyToken, userController.matchIdAllDetails)

router.post("/refferal", userController.useRefferalCode)


module.exports = router
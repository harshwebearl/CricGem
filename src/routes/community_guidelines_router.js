const router = require("express").Router();
const CommunityGuidelinesController = require("../controller/community_guidelines_controller");




router.post("/create", CommunityGuidelinesController.addCommunityGuidelines);
router.get("/display", CommunityGuidelinesController.getCommunityGuidelines);
router.put('/update/:id', CommunityGuidelinesController.updateCommunityGuidelines)


module.exports = router
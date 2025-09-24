const router = require("express").Router();
const documentController = require("../controller/documentController");
const { userVerifyToken, adminVerifyToken } = require("../middleware/auth");
const document = require("../middleware/documentPhoto");




router.post("/addDocument", userVerifyToken, document, documentController.addDocument)
router.put("/updateStatus", adminVerifyToken, documentController.updateStatus)
router.put('/update', userVerifyToken, document, documentController.updateDocumentDetails)
router.get('/display', userVerifyToken, documentController.getDocumentDetails)
router.get('/displayAdmin', adminVerifyToken, documentController.getDocumentByAdmin)
router.get("/displatList", adminVerifyToken, documentController.documentList)

module.exports = router
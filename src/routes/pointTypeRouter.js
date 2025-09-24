
const { pointTypeInsert, displayAll, updatePointType, deletePointType, displayById } = require('../controller/pointTypeController');
const { adminVerifyToken } = require('../middleware/auth');

const router = require('express').Router();

router.post('/insertpointType',adminVerifyToken, pointTypeInsert);
router.get('/displayAll',adminVerifyToken,displayAll)
router.get('/display/:id', adminVerifyToken,displayById)
router.put('/update/:id',adminVerifyToken,updatePointType)
router.delete('/delete/:id',adminVerifyToken,deletePointType)

module.exports=router;
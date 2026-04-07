const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);


router.put('/role', memberController.updateRole); //권한 수정
router.delete('/delete', memberController.deleteMember); // 멤버 삭제

module.exports = router;
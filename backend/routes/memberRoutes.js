const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');


router.put('/role', memberController.updateRole); //권한 수정
router.delete('/delete', memberController.deleteMember); // 멤버 삭제

module.exports = router; 
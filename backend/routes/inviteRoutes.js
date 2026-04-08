const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/search-users', authMiddleware, inviteController.searchUsers); // 초대장 발송시 이메일 자동완성
router.post('/send',inviteController.sendInvite); // 초대장 발송
router.delete('/cancel', inviteController.cancelInvite); // 초대장 발송 취소
router.put('/response',inviteController.inviteResponse); // 초대장 수락,거절
router.get('/sendlist', inviteController.sendInviteList); // 보낸 초대장 리스트
router.get('/receivelist', inviteController.receiveInviteList); //  받은 초대장 리스트

module.exports = router;
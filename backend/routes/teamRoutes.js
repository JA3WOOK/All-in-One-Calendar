const express = require("express");
const router = express.Router();
const teamController = require("../controllers/teamController");



router.post("/teams", teamController.createTeam); // 그룹 생성
router.put('/teams/:team_id', teamController.updateTeam); // 그룹수정
router.delete('/teams/:team_id', teamController.deleteTeam); // 그룹삭제

router.get('/myteams', teamController.getTeamList); // 내 그룹목록 조회
router.get('/teams/:team_id/members', teamController.getTeamMembers); //선택한 그룹 멤버 조회

module.exports = router;
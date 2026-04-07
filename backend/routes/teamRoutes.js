const express = require("express");
const router  = express.Router();
const teamController = require("../controllers/teamController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/",                    teamController.createTeam);    // 그룹 생성
router.get("/",                     teamController.getTeamList);   // 내 그룹 목록 조회
router.put("/:team_id",             teamController.updateTeam);    // 그룹 수정
router.delete("/:team_id",          teamController.deleteTeam);    // 그룹 삭제
router.get("/:team_id/members",     teamController.getTeamMembers); // 그룹 멤버 조회

module.exports = router;
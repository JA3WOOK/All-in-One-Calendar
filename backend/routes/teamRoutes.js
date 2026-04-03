const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// POST /api/groups 요청 처리
router.post('/', async (req, res) => {
  try {
    const { name, user_id } = req.body; // 프론트에서 보낸 데이터

    // 1. DB의 teams 테이블에 저장
    // team_name, created_by, updated_by 등 필드명 확인
    const [result] = await pool.query(
      `INSERT INTO teams (team_name, created_by, updated_by, team_color) 
       VALUES (?, ?, ?, ?)`,
      [name, user_id, user_id, '#85a5ff'] // 기본 색상 추가
    );

    const teamId = result.insertId;

    // 그룹을 만든 사람을 team_members 테이블에 OWNER로 추가 (선택 사항이지만 권장)
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role, user_team_color) 
       VALUES (?, ?, 'OWNER', '#85a5ff')`,
      [teamId, user_id]
    );

    res.status(201).json({ 
      success: true, 
      message: "그룹(팀) 생성 완료", 
      teamId: teamId 
    });
  } catch (err) {
    console.error("그룹 생성 에러:", err);
    res.status(500).json({ success: false, message: "서버 DB 에러" });
  }
});

// GET /api/teams -> 로그인한 유저의 팀 목록 가져오기
router.get('/', async (req, res) => {
  try {
    const user_id = 1; // 테스트용 (나중에 로그인 세션으로 변경)
    
    // 내가 생성했거나, 내가 멤버로 속한 팀을 가져오는 쿼리
    const [rows] = await pool.query(
      `SELECT t.* FROM teams t 
       JOIN team_members tm ON t.team_id = tm.team_id 
       WHERE tm.user_id = ? AND t.is_deleted = FALSE`, 
      [user_id]
    );
    
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "팀 목록 로드 실패" });
  }
});

module.exports = router;
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// POST /api/teams — 팀 생성 (team_color 포함)
router.post('/', async (req, res) => {
  try {
    const { name, team_color, user_id } = req.body;

    // team_color 기본값 보정: 7자리 hex가 아니면 기본값 사용
    const safeColor = /^#[0-9a-fA-F]{6}$/.test(team_color) ? team_color : '#4a80c4';

    const [result] = await pool.query(
        `INSERT INTO teams (team_name, created_by, updated_by, team_color)
         VALUES (?, ?, ?, ?)`,
        [name, user_id, user_id, safeColor]
    );

    const teamId = result.insertId;

    // 생성자를 team_members에 OWNER로 추가
    await pool.query(
        `INSERT INTO team_members (team_id, user_id, role, user_team_color)
         VALUES (?, ?, 'OWNER', ?)`,
        [teamId, user_id, safeColor]
    );

    res.status(201).json({ success: true, message: '그룹(팀) 생성 완료', teamId });
  } catch (err) {
    console.error('그룹 생성 에러:', err);
    res.status(500).json({ success: false, message: '서버 DB 에러' });
  }
});

// GET /api/teams — 로그인한 유저의 팀 목록 (team_color 포함)
router.get('/', async (req, res) => {
  try {
    const user_id = req.query.user_id ?? 1; // 인증 전 임시

    const [rows] = await pool.query(
        `SELECT t.team_id, t.team_name, t.team_color, t.description, t.created_at
         FROM teams t
                JOIN team_members tm ON t.team_id = tm.team_id
         WHERE tm.user_id = ? AND t.is_deleted = FALSE
         ORDER BY t.created_at ASC`,
        [user_id]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '팀 목록 로드 실패' });
  }
});

module.exports = router;
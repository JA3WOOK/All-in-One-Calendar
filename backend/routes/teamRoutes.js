const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

const safeHex = (color, fallback = '#4a80c4') =>
    /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;

// POST /api/teams
router.post('/', async (req, res) => {
  try {
    const { name, team_color, user_id } = req.body;
    const color = safeHex(team_color);
    const [result] = await pool.query(
        `INSERT INTO teams (team_name, created_by, updated_by, team_color) VALUES (?, ?, ?, ?)`,
        [name, user_id, user_id, color]
    );
    const teamId = result.insertId;
    await pool.query(
        `INSERT INTO team_members (team_id, user_id, role, user_team_color) VALUES (?, ?, 'OWNER', ?)`,
        [teamId, user_id, color]
    );
    res.status(201).json({ success: true, message: '그룹(팀) 생성 완료', teamId });
  } catch (err) {
    console.error('그룹 생성 에러:', err);
    res.status(500).json({ success: false, message: '서버 DB 에러' });
  }
});

// GET /api/teams
router.get('/', async (req, res) => {
  try {
    const user_id = req.query.user_id ?? 1;
    const [rows] = await pool.query(
        `SELECT t.team_id, t.team_name, t.team_color, t.description, t.created_at
         FROM teams t JOIN team_members tm ON t.team_id = tm.team_id
         WHERE tm.user_id = ? AND t.is_deleted = FALSE ORDER BY t.created_at ASC`,
        [user_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('팀 목록 로드 실패:', err);
    res.status(500).json({ message: '팀 목록 로드 실패' });
  }
});

// PUT /api/teams/:team_id
router.put('/:team_id', async (req, res) => {
  try {
    const { team_id } = req.params;
    const { name, team_color, user_id = 1 } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: '그룹 이름은 필수입니다.' });
    const color = safeHex(team_color);
    const [result] = await pool.query(
        `UPDATE teams SET team_name = ?, team_color = ?, updated_by = ?, updated_at = NOW()
       WHERE team_id = ? AND is_deleted = FALSE`,
        [name.trim(), color, user_id, team_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    res.json({ success: true, message: '그룹 수정 완료' });
  } catch (err) {
    console.error('그룹 수정 에러:', err);
    res.status(500).json({ success: false, message: '서버 DB 에러' });
  }
});

// DELETE /api/teams/:team_id — soft delete (팀 + 소속 일정/할일)
router.delete('/:team_id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { team_id } = req.params;
    const user_id = req.body?.user_id ?? 1;
    await conn.beginTransaction();

    const [teamResult] = await conn.query(
        `UPDATE teams SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
       WHERE team_id = ? AND is_deleted = FALSE`,
        [user_id, team_id]
    );
    if (teamResult.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    await conn.query(
        `UPDATE schedules SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
       WHERE team_id = ? AND is_deleted = FALSE`,
        [user_id, team_id]
    );
    await conn.query(
        `UPDATE todos SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
       WHERE team_id = ? AND is_deleted = FALSE`,
        [user_id, team_id]
    );

    await conn.commit();
    res.json({ success: true, message: '그룹 및 소속 데이터가 삭제되었습니다.' });
  } catch (err) {
    await conn.rollback();
    console.error('그룹 삭제 에러:', err);
    res.status(500).json({ success: false, message: '서버 DB 에러' });
  } finally {
    conn.release();
  }
});

module.exports = router;
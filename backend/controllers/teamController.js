const teamModel = require('../models/teamModel');
const pool      = require('../config/db');

// ── hex 색상 검증 헬퍼 ────────────────────────────
const safeHex = (color, fallback = '#4a80c4') =>
    /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;

// ── 유효성 검사 ───────────────────────────────────
function validateTeam(body, isUpdate = false) {
    const errors = [];
    const name = body.name || body.team_name;
    if (!name || name.trim() === '') errors.push('그룹 이름을 입력하세요.');
    if (!isUpdate && !body.team_color)  errors.push('그룹 색상을 선택하세요.');
    return errors;
}

// ── 그룹 생성 ─────────────────────────────────────
// POST /api/teams  body: { name, team_color, user_id }
exports.createTeam = async (req, res) => {
    const errors = validateTeam(req.body);
    if (errors.length) return res.status(400).json({ errors });

    try {
        const { name, team_color } = req.body;
        const created_by = req.user.user_id;
        const color = safeHex(team_color);

        // 그룹명 중복 확인
        const isDuplicate = await teamModel.checkGroupNameExists(created_by, name);
        if (isDuplicate) {
            return res.status(400).json({ error: '중복된 그룹명', message: '동일한 그룹명이 존재합니다.' });
        }

        const teamData = { team_name: name, team_color: color };
        const result = await teamModel.create(teamData, created_by);
        res.status(201).json({ message: '그룹 생성 완료', result });
    } catch (err) {
        console.error('그룹 생성 실패:', err);
        res.status(500).json({ error: '생성 실패' });
    }
};

// ── 내 그룹 목록 조회 ─────────────────────────────
// GET /api/teams
exports.getTeamList = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const results = await teamModel.findMyTeam(user_id);
        res.json(results);
    } catch (err) {
        console.error('내 그룹 목록 조회 실패:', err);
        res.status(500).json({ error: '내 그룹 목록 조회 실패' });
    }
};

// ── 그룹 수정 ─────────────────────────────────────
// PUT /api/teams/:team_id  body: { name, team_color, user_id }
exports.updateTeam = async (req, res) => {
    const errors = validateTeam(req.body, true);
    if (errors.length) return res.status(400).json({ errors });

    try {
        const { team_id } = req.params;
        const { name, team_color } = req.body;
        const user_id = req.user.user_id;
        const color = safeHex(team_color);

        const updateData = { team_name: name.trim(), team_color: color };
        const result = await teamModel.update(team_id, updateData, user_id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
        }
        res.json({ message: '그룹 정보 수정 완료', result });
    } catch (err) {
        console.error('그룹 정보 수정 실패:', err);
        res.status(500).json({ error: '정보 수정 실패' });
    }
};

// ── 그룹 삭제 (soft delete, 트랜잭션) ─────────────
// DELETE /api/teams/:team_id  body: { user_id }
exports.deleteTeam = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { team_id } = req.params;
        const user_id = req.user.user_id;

        await conn.beginTransaction();

        // 1. 팀 soft-delete
        const [teamResult] = await conn.query(
            `UPDATE teams SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
             WHERE team_id = ? AND is_deleted = FALSE`,
            [user_id, team_id]
        );
        if (teamResult.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: '팀을 찾을 수 없습니다.' });
        }

        // 2. 소속 일정 soft-delete
        await conn.query(
            `UPDATE schedules SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
             WHERE team_id = ? AND is_deleted = FALSE`,
            [user_id, team_id]
        );

        // 3. 소속 할일 soft-delete
        await conn.query(
            `UPDATE todos SET is_deleted = TRUE, updated_by = ?, updated_at = NOW()
             WHERE team_id = ? AND is_deleted = FALSE`,
            [user_id, team_id]
        );

        await conn.commit();
        res.json({ message: '그룹 및 소속 데이터 삭제 완료' });
    } catch (err) {
        await conn.rollback();
        console.error('그룹 삭제 실패:', err);
        res.status(500).json({ error: '삭제 실패' });
    } finally {
        conn.release();
    }
};

// ── 선택한 그룹 멤버 조회 ─────────────────────────
// GET /api/teams/:team_id/members
exports.getTeamMembers = async (req, res) => {
    try {
        const { team_id } = req.params;
        const results = await teamModel.findTeamMembers(team_id);
        res.json(results);
    } catch (err) {
        console.error('그룹 멤버 조회 실패:', err);
        res.status(500).json({ error: '그룹 멤버 조회 실패' });
    }
};
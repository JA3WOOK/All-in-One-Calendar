import db from '../config/db.js';

// [UI 매핑] CalendarStatsDashboard.tsx - 우측 상단 아코디언 (전체/개인/팀)
const buildCondition = (filterType, userId, teamId) => {
  if (filterType === 'personal') return { clause: 'user_id = ? AND team_id IS NULL', params: [userId] };
  if (filterType === 'team') return { clause: 'team_id = ?', params: [teamId] };
  return { clause: '(user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ?))', params: [userId, userId] };
};

/**
 * [UI 매핑] CalendarStatsDashboard.tsx
 * - 우측 중앙 '루틴 달성 현황' 박스: 개별 스케줄(루틴)별 목표/달성 일수 표시
 * * [수정 사항] GROUP BY category -> GROUP BY title (개별 스케줄 제목 기준 집계)
 */
export const getRoutineStats = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT title AS routine_name,
      COUNT(DISTINCT DATE(start_at)) AS targetDays,
      COUNT(DISTINCT CASE WHEN is_done = 1 THEN DATE(start_at) END) AS achievedDays
    FROM schedules
    WHERE (sched_id, updated_at) IN (
      SELECT sched_id, MAX(updated_at) FROM schedules
      WHERE ${clause} AND is_deleted = 0
      AND start_at BETWEEN ? AND ?
      GROUP BY sched_id
    ) GROUP BY title`; 
    // 카테고리가 아닌 스케줄의 제목(title)을 기준으로 그룹화하여 개별 루틴으로 출력

  const [rows] = await db.execute(sql, sqlParams);
  
  return rows.map(r => ({
    name: r.routine_name, // 프론트엔드 UI의 {routine.name}에 스케줄 제목이 들어가도록 매핑
    targetDays: Number(r.targetDays),
    achievedDays: Number(r.achievedDays)
  }));
};
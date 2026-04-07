import db from '../config/db.js';
import { mapCategoryToKorean } from '../utils/categoryMapper.js';

/**
 * [UI 매핑] CalendarStatsDashboard.tsx - 우측 상단 아코디언 (전체/개인/팀)
 * 선택된 그룹에 따라 SQL WHERE 절을 동적으로 생성
 */
const buildCondition = (filterType, userId, teamId) => {
  if (filterType === 'personal') {
    // 개인 일정: 팀 ID가 없고 내 유저 ID인 것
    return { clause: 'user_id = ? AND team_id IS NULL', params: [userId] };
  } else if (filterType === 'team') {
    // 팀 일정: 특정 팀 ID와 일치하는 것
    return { clause: 'team_id = ?', params: [teamId] };
  } else {
    // 전체 일정: 내 개인 일정 + 내가 멤버로 속한 모든 팀의 일정
    return { 
      clause: '(user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ?))', 
      params: [userId, userId] 
    };
  }
};

/**
 * [UI 매핑] CalendarStatsDashboard.tsx
 * 1. <PieChart>: 좌측 도넛 차트 (카테고리별 비중)
 * 2. <table>: 하단 '일정 달성률 요약' 테이블 (전체, 미달성, 달성률)
 * * [검사 로직] repeat_group_id 기준 최신 이력 조회 적용
 */
export const getTodoStats = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT category AS raw_category, COUNT(*) AS total,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 0 THEN 1 ELSE 0 END) AS onTime,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 1 THEN 1 ELSE 0 END) AS carried
    FROM todos
    WHERE (todo_id, updated_at) IN (
      /* repeat_group_id와 todo_id를 결합하여 해당 일정의 가장 최신 수정본만 추출 */
      SELECT todo_id, MAX(updated_at) FROM todos
      WHERE ${clause} AND is_deleted = 0
      AND due_date BETWEEN ? AND ?
      GROUP BY todo_id, repeat_group_id
    ) GROUP BY category`;
  
  const [rows] = await db.execute(sql, sqlParams);
  const totalSum = rows.reduce((s, r) => s + Number(r.total), 0);
  
  return rows.map(r => ({
    name: mapCategoryToKorean(r.raw_category),
    value: totalSum === 0 ? 0 : Math.round((Number(r.total) * 100) / totalSum),
    completedOnTime: Number(r.onTime),
    completedCarriedOver: Number(r.carried),
    total: Number(r.total)
  }));
};

/**
 * [UI 매핑] 모달 컴포넌트
 * 1. <ScheduleDetailModal>: '달성한/이월된 일정 상세 보기' 버튼 클릭 시 리스트업
 * 2. <CalendarModal>: '전체 캘린더 보기' 시 날짜별로 박스 렌더링
 */
export const getDetailedTodos = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT CONCAT('t_', todo_id) AS id, content AS title, category AS raw_category, 
           DATE_FORMAT(due_date, '%Y-%m-%d') AS date, '00:00' AS time, is_carried_over
    FROM todos 
    WHERE (todo_id, updated_at) IN (
      SELECT todo_id, MAX(updated_at) FROM todos
      WHERE ${clause} AND is_done = 1 AND is_deleted = 0
      AND due_date BETWEEN ? AND ?
      GROUP BY todo_id, repeat_group_id
    )`;

  const [rows] = await db.execute(sql, sqlParams);
  
  const completed = {};
  const carriedOver = {};
  
  rows.forEach(row => {
    const category = mapCategoryToKorean(row.raw_category);
    const target = row.is_carried_over === 1 ? carriedOver : completed;
    if (!target[category]) target[category] = [];
    target[category].push({
      id: row.id,
      title: row.title,
      category: category,
      date: row.date,
      time: row.time
    });
  });

  return { completed, carriedOver };
};
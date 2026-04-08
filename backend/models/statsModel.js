const db = require("../config/db");

// 카테고리 한글 변환 헬퍼 함수
const mapCategoryToKorean = (category) => {
  const mapper = { 'WORK': '업무', 'EXERCISE': '운동', 'SELF_DEV': '공부', 'HOBBY': '개인', 'ETC': '기타' };
  return mapper[category] || '기타';
};

// 조건문 생성 헬퍼 함수
const buildCondition = (filterType, userId, teamId) => {
  if (filterType === 'personal') return { clause: 'user_id = ? AND team_id IS NULL', params: [userId] };
  if (filterType === 'team') return { clause: 'team_id = ?', params: [teamId] };
  return { 
    clause: '(user_id = ? OR team_id IN (SELECT team_id FROM team_members WHERE user_id = ? AND is_deleted = FALSE))', 
    params: [userId, userId] 
  };
};

// 1. 카테고리별 달성률 통계 (todos 기반)
exports.getTodoStats = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT category AS raw_category, COUNT(*) AS total,
      SUM(CASE WHEN is_done = TRUE AND is_carried_over = FALSE THEN 1 ELSE 0 END) AS onTime,
      SUM(CASE WHEN is_done = TRUE AND is_carried_over = TRUE THEN 1 ELSE 0 END) AS carried
    FROM todos
    WHERE (todo_id, updated_at) IN (
      SELECT todo_id, MAX(updated_at) FROM todos
      WHERE ${clause} AND is_deleted = FALSE
      AND due_date BETWEEN ? AND ?
      GROUP BY todo_id, repeat_group_id
    ) GROUP BY category`;
  
  const [rows] = await db.query(sql, sqlParams);
  const totalSum = rows.reduce((s, r) => s + Number(r.total), 0);
  
  return rows.map(r => ({
    name: mapCategoryToKorean(r.raw_category),
    value: totalSum === 0 ? 0 : Math.round((Number(r.total) * 100) / totalSum),
    completedOnTime: Number(r.onTime),
    completedCarriedOver: Number(r.carried),
    total: Number(r.total)
  }));
};

// 2. 루틴 달성 현황 (schedules 기반)
exports.getRoutineStats = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT title AS routine_name,
      COUNT(DISTINCT DATE(start_at)) AS targetDays,
      COUNT(DISTINCT CASE WHEN is_done = TRUE THEN DATE(start_at) END) AS achievedDays
    FROM schedules
    WHERE (sched_id, updated_at) IN (
      SELECT sched_id, MAX(updated_at) FROM schedules
      WHERE ${clause} AND is_deleted = FALSE
      AND start_at BETWEEN ? AND ?
      GROUP BY sched_id, repeat_group_id
    ) GROUP BY title`;

  const [rows] = await db.query(sql, sqlParams);
  
  return rows.map(r => ({
    name: r.routine_name,
    targetDays: Number(r.targetDays),
    achievedDays: Number(r.achievedDays)
  }));
};

// 3. 상세 일정 내역 (todos 기반)
exports.getDetailedTodos = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT CONCAT('t_', todo_id) AS id, content AS title, category AS raw_category, 
           DATE_FORMAT(due_date, '%Y-%m-%d') AS date, '00:00' AS time, is_carried_over
    FROM todos 
    WHERE (todo_id, updated_at) IN (
      SELECT todo_id, MAX(updated_at) FROM todos
      WHERE ${clause} AND is_done = TRUE AND is_deleted = FALSE
      AND due_date BETWEEN ? AND ?
      GROUP BY todo_id, repeat_group_id
    )`;

  const [rows] = await db.query(sql, sqlParams);
  
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
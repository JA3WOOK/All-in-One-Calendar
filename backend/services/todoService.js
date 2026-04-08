// services/todoService.js
const db = require('../config/db.js');
const { mapCategoryToKorean } = require('../utils/categoryMapper.js');
const { buildCondition } = require('../utils/queryBuilder.js');

const getTodoStats = async (userId, filterType, teamId, start, end) => {
  const { clause, params } = buildCondition(filterType, userId, teamId);
  const sqlParams = [...params, start, end];

  const sql = `
    SELECT category AS raw_category, COUNT(*) AS total,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 0 THEN 1 ELSE 0 END) AS onTime,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 1 THEN 1 ELSE 0 END) AS carried
    FROM todos
    WHERE (todo_id, updated_at) IN (
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

const getDetailedTodos = async (userId, filterType, teamId, start, end) => {
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

module.exports = { getTodoStats, getDetailedTodos };
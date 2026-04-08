const db = require('../config/db.js');
const { mapCategoryToKorean } = require('../utils/categoryMapper.js');

 const getTodoScheduleData = async (userId, teamId, start, end) => {
  const sql = `
    SELECT category AS raw_category, COUNT(*) AS total,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 0 THEN 1 ELSE 0 END) AS onTime,
      SUM(CASE WHEN is_done = 1 AND is_carried_over = 1 THEN 1 ELSE 0 END) AS carried
    FROM todos
    WHERE (todo_id, updated_at) IN (
      SELECT todo_id, MAX(updated_at) FROM todos
      WHERE (user_id = ? OR team_id = ?) AND due_date >= ? AND due_date <= ? AND is_deleted = 0
      GROUP BY todo_id
    ) GROUP BY category`;
    
  const [rows] = await db.execute(sql, [userId, teamId || null, start, end]);
  const totalSum = rows.reduce((sum, r) => sum + Number(r.total), 0);

  return rows.map(r => ({
    name: mapCategoryToKorean(r.raw_category),
    total: Number(r.total),
    completedOnTime: Number(r.onTime),
    completedCarriedOver: Number(r.carried),
    value: totalSum === 0 ? 0 : Math.round((Number(r.total) * 100) / totalSum)
  }));
};
module.exports = { getTodoScheduleData };
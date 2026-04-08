// services/routineService.js
const db = require('../config/db.js');
const { buildCondition } = require('../utils/queryBuilder.js');

const getRoutineStats = async (userId, filterType, teamId, start, end) => {
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

  const [rows] = await db.execute(sql, sqlParams);
  
  return rows.map(r => ({
    name: r.routine_name, 
    targetDays: Number(r.targetDays),
    achievedDays: Number(r.achievedDays)
  }));
};

module.exports = { getRoutineStats };
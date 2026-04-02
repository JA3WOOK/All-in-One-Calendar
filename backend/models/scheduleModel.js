const pool = require('../config/db');

// 1. 일정 조회
const getAllSchedules = async () => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedules WHERE is_deleted = 0"); // 삭제 안 된 것만!
    return rows;
  } catch (err) {
    throw err;
  }
};

// 2. 일정 생성
const createSchedule = async (scheduleData) => {
  try {
    // 명세서에 있는 필수/주요 컬럼들을 구조 분해 할당으로 가져옵니다.
    const { 
      title, 
      description, 
      start_at, 
      end_at, 
      priority, 
      category,    // 명세서에 'Not Null'로 정의됨!
      user_id, 
      team_id 
    } = scheduleData;

    const query = `
        INSERT INTO schedules (
          title, description, start_at, end_at, 
          priority, category, user_id, team_id,
          created_by, updated_by  -- 생성자와 수정자도 처음엔 작성자 ID로!
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // team_id나 description은 없을 수도 있으니 || null 처리를 해줍니다.
    const [result] = await pool.query(query, [
      title, 
      description || null, 
      start_at, 
      end_at, 
      priority || 'MEDIUM', // 기본값 설정
      category,             // 필수값 (self_dev, work 등)
      user_id, 
      team_id || null,
      user_id,              // created_by
      user_id               // updated_by
    ]);

    return result;
  } catch (err) {
    console.error("모델 에러:", err);
    throw err;
  }
};

// 일정 수정 SQL 실행 함수
const updateSchedule = async (id, data) => {
  const { title, description, start_at, end_at, priority, category, updated_by } = data;
  
  const sql = `
    UPDATE Schedules 
    SET 
      title = ?, 
      description = ?, 
      start_at = ?, 
      end_at = ?, 
      priority = ?, 
      category = ?,
      updated_by = ?,   -- 명세서에 있는 수정자 ID 반영
      updated_at = NOW() -- 수정 일시 갱신
    WHERE sched_id = ? AND is_deleted = False
  `;
  
  // soft delete된 항목은 수정되지 않도록 조건을 추가하면 더 안전합니다.
  const values = [title, description, start_at, end_at, priority, category, updated_by, id];
  
  const [result] = await pool.query(sql, values);
  return result;
};

// 일정 삭제 (Soft Delete)
const deleteSchedule = async (id, updated_by) => {
  try {
    const sql = `
      UPDATE schedules 
      SET 
        is_deleted = 1, 
        updated_by = ?, 
        updated_at = NOW() 
      WHERE sched_id = ?
    `;
    const [result] = await pool.query(sql, [updated_by, id]);
    return result;
  } catch (err) {
    console.error("삭제 모델 에러:", err);
    throw err;
  }
};

// 작성한 함수들을 모두 내보내기
module.exports = { 
    getAllSchedules, 
    createSchedule,
    updateSchedule,
    deleteSchedule
};
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

// 작성한 함수들을 모두 내보내기
module.exports = { 
    getAllSchedules, 
    createSchedule 
};
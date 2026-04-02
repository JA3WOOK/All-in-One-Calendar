//일정 관련 SQL 쿼리 모음

const pool = require('../config/db'); // 설정 파일을 불러옵니다!

const getAllSchedules = async () => {
  try {
    // pool을 사용해서 쿼리를 날립니다.
    const [rows] = await pool.query("SELECT * FROM schedules");
    return rows;
  } catch (err) {
    throw err;
  }
};

module.exports = { getAllSchedules };


const pool = require("../config/db");

// login_id로 사용자 조회 
exports.getUserByLoginId = async (login_id) => {
   const sql = `
      SELECT user_id, login_id, password, name, email, phone, department, profile_image
      FROM users
      WHERE login_id = ?
   `;

   const [rows] = await pool.query(sql, [login_id]);
   return rows;
};

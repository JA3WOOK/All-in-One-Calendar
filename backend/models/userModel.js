const pool = require("..config/db");

// login_id로 사용자 조회 
exports.findByLoginId = async (login_id) => {
   const sql = `
      SELETE user_id, login_id, password, name
      FROM users
      WHERE logon_id = ?
   `;

   const [rows] = await pool.query(sql, [login_id]);
   return rows;
};

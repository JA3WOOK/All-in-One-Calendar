const pool = require("../config/db");


exports.getUserByEmail = async (email) => {
   const sql = `
      SELECT user_id, login_id, password, name, email, phone, department, profile_image
      FROM users
      WHERE email = ?
   `;

   const [rows] = await pool.query(sql, [email]);
   return rows;
};

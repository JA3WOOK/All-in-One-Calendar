const pool = require("../config/db");


exports.getUserByEmail = async (email) => {
   const sql = `
      SELECT user_id, password, name, email, phone, department, profile_image
      FROM users
      WHERE email = ?
   `;

   const [rows] = await pool.query(sql, [email]);
   return rows;
};

exports.createUser = async (login_id, name, email, password) => {
   const sql = `
   INSERT INTO users (name, email, password)
   VALUES(?, ?, ?, ?)`;

   const [result] = await pool.query(sql, [name, email, password]);
   return result;
}

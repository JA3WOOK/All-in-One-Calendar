const pool = require("../config/db");

// 저장
exports.create = async (user_id, token, expiry_date, ip) => {
  const sql = `
    INSERT INTO refresh_tokens (user_id, token, expiry_date, login_ip)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    user_id,
    token,
    expiry_date,
    ip,
  ]);
  return result;
};

// 조회
exports.findByToken = async (token) => {
  const sql = `
    SELECT *
    FROM refresh_tokens
    WHERE token = ?
  `;
  const [rows] = await pool.query(sql, [token]);
  return rows[0];
};

// 무효화
exports.revoke = async (token) => {
  const sql = `
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token = ?
  `;
  const [result] = await pool.query(sql, [token]);
  return result;
};
// services/userService.js
const db = require("../config/db");

const getUserById = async (userId) => {
  const sql = `
    SELECT user_id, name, email, phone, department, profile_image, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows.length ? rows[0] : null;
};

const updateUserProfile = async (userId, data) => {
  const { name, phone, department, profile_image } = data;

  const sql = `
    UPDATE users
    SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      department = COALESCE(?, department),
      profile_image = COALESCE(?, profile_image)
    WHERE user_id = ?
  `;

  const [result] = await db.query(sql, [
    name,
    phone,
    department,
    profile_image,
    userId,
  ]);

  if (result.affectedRows === 0) return null;

  return await getUserById(userId);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  // 현재 비밀번호 조회
  const [rows] = await db.query(
    "SELECT password FROM users WHERE user_id = ?",
    [userId]
  );

  if (rows.length === 0) return null;

  const user = rows[0];

  // 현재 비밀번호 체크 (지금은 그냥 문자열 비교)
  if (user.password !== currentPassword) {
    return null;
  }

  // 새 비밀번호로 변경
  await db.query(
    "UPDATE users SET password = ? WHERE user_id = ?",
    [newPassword, userId]
  );

  return true;
};

const deleteUserById = async (userId) => {
  const [result] = await db.query(
    "DELETE FROM users WHERE user_id = ?",
    [userId]
  );

  if (result.affectedRows === 0) return null;

  return true;
};

const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT user_id, email, name FROM users WHERE email = ?",
    [email]
  );

  return rows.length ? rows[0] : null;
};

const resetPasswordByEmail = async (email, newPassword) => {
  const [result] = await db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [newPassword, email]
  );

  if (result.affectedRows === 0) return null;

  return true;
};


module.exports = {
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUserById,
  findUserByEmail,
  resetPasswordByEmail,
};
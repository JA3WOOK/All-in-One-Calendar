const db = require("../config/db");
const bcrypt = require("bcrypt");

// 사용자 조회
const getUserById = async (userId) => {
  const sql = `
    SELECT user_id, name, email, phone, department, profile_image, created_at, updated_at
    FROM users
    WHERE user_id = ?
  `;

  const [rows] = await db.query(sql, [userId]);
  return rows.length ? rows[0] : null;
};

// 프로필 수정
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

// 비밀번호 변경 (현재 비번 입력)
const changePassword = async (userId, currentPassword, newPassword) => {
  const [rows] = await db.query(
    "SELECT password FROM users WHERE user_id = ?",
    [userId]
  );

  if (rows.length === 0) return null;

  const user = rows[0];

  // 현재 비밀번호 체크
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return null;

  // 새 비밀번호로 변경
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.query(
    "UPDATE users SET password = ? WHERE user_id = ?",
    [hashedPassword, userId]
  );

  return true;
};

// 계정 삭제
const deleteUserById = async (userId) => {
  const [result] = await db.query(
    "DELETE FROM users WHERE user_id = ?",
    [userId]
  );

  if (result.affectedRows === 0) return null;

  return true;
};

// 이메일로 사용자 찾기 (비번 재설정용)
const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT user_id, email, name FROM users WHERE email = ?",
    [email]
  );

  return rows.length ? rows[0] : null;
};

// 이메일 기반 비밀번호 재설정
const resetPasswordByEmail = async (email, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const [result] = await db.query(
    "UPDATE users SET password = ? WHERE email = ?",
    [hashedPassword, email]
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
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

// 비밀번호 변경
const changePassword = async (userId, currentPassword, newPassword) => {
  const [rows] = await db.query(
    "SELECT password FROM users WHERE user_id = ?",
    [userId]
  );

  if (rows.length === 0) return null;

  const user = rows[0];

  // 기존 비밀번호 확인
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return null;

  // 🔥 추가: 기존 비밀번호와 동일한지 검사
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return null; // 기존과 같은 비밀번호 사용 불가
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.query(
    "UPDATE users SET password = ? WHERE user_id = ?",
    [hashedPassword, userId]
  );

  return true;
};

// 계정 삭제
const deleteUserById = async (userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "UPDATE invitations SET status = 'REJECTED' WHERE inviter_id = ? OR invitee_id = ?",
      [userId, userId]
    );

    await conn.query(
      "UPDATE team_members SET is_deleted = TRUE WHERE user_id = ?",
      [userId]
    );

    await conn.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
      [userId]
    );

    await conn.query(
      "UPDATE schedules SET is_deleted = TRUE WHERE user_id = ?",
      [userId]
    );
    await conn.query(
      "UPDATE todos SET is_deleted = TRUE WHERE user_id = ?",
      [userId]
    );

    const [result] = await conn.query(
      "UPDATE users SET is_deleted = TRUE WHERE user_id = ?",
      [userId]
    );

    await conn.commit();
    if (result.affectedRows === 0) return null;
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 이메일로 사용자 찾기
const findUserByEmail = async (email) => {
  const [rows] = await db.query(
    "SELECT user_id, email, name FROM users WHERE email = ?",
    [email]
  );

  return rows.length ? rows[0] : null;
};

// 이메일 기준 비밀번호 재설정
const resetPasswordByEmail = async (email, newPassword) => {
  // 🔥 추가: 기존 비밀번호 조회
  const [rows] = await db.query(
    "SELECT password FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) return null;

  // 🔥 추가: 기존 비밀번호와 동일한지 검사
  const isSame = await bcrypt.compare(newPassword, rows[0].password);
  if (isSame) {
    return null; // 동일 비밀번호 방지
  }

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
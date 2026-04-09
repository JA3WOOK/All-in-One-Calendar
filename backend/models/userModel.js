const pool = require("../config/db");

// 로그인용: 이메일로 사용자 조회
exports.getUserByEmail = async (email) => {
  const sql = `
    SELECT user_id, password, name, email, phone, department, profile_image, is_deleted
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [email]);
  return rows;
};

// 회원가입용: 삭제 여부 포함 전체 조회
exports.getAnyUserByEmail = async (email) => {
  const sql = `
    SELECT user_id, password, name, email, phone, department, profile_image, is_deleted
    FROM users
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [email]);
  return rows;
};

// 신규 회원 생성
exports.createUser = async (name, email, password, profileImage) => {
  const sql = `
    INSERT INTO users (name, email, password, profile_image)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    name,
    email,
    password,
    profileImage,
  ]);

  return result;
};

// 탈퇴 계정 복구(재가입)
exports.restoreDeletedUser = async (name, email, password, profileImage) => {
  const sql = `
    UPDATE users
    SET
      name = ?,
      password = ?,
      profile_image = ?,
      phone = NULL,
      department = NULL,
      is_deleted = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
      AND is_deleted = 1
  `;

  const [result] = await pool.query(sql, [
    name,
    password,
    profileImage,
    email,
  ]);

  return result;
};
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwtUtil");

// 로그인
exports.login = async (email, password) => {
  const rows = await userModel.getUserByEmail(email);

  // 조회 결과 확인 로그 
  console.log("login email:", email);
  console.log("login rows:", rows);

  if (!rows || rows.length === 0) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const user = rows[0];

  // [추가] 조회된 사용자 확인
  console.log("login user:", user);


  if (user.is_deleted) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

   // [추가] 비밀번호 비교 결과 확인
  console.log("password match:", isMatch);

  if (!isMatch) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const accessToken = createToken({
    user_id: user.user_id,
    email: user.email,
  });

  return {
    message: "로그인 성공",
    accessToken,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      profile_image: user.profile_image,
    },
  };
};

// 회원가입
exports.signup = async (name, email, password) => {
  const existingUser = await userModel.getUserByEmail(email);
 
  if (existingUser && existingUser.length > 0) {
    const error = new Error("이미 사용 중인 이메일입니다.");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await userModel.createUser(name, email, hashedPassword);



  return {
    message: "회원가입 성공",
    user_id: result.insertId,
  };
};

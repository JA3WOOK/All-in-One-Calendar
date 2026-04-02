
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwtUtil");

exports.login = async (email, password) => {

  const rows = await userModel.getUserByEmail(email);
  
  if (rows.length === 0) {
    const error = new Error("조회된 사용자가 없습니다.");
    error.status = 401;
    throw error;
  }

  const user = rows[0];

  if (password !== String(user.password).trim()) {
    const error = new Error("비밀번호가 일치하지 않습니다.");
    error.status = 401;
    throw error;
  }

  const accessToken = createToken({
    user_id: user.user_id,
    email: user.email,
  });

  return {
    accessToken,
    user: {
      user_id: user.user_id,
      login_id: user.login_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      profile_image: user.profile_image,
    },
  };
};



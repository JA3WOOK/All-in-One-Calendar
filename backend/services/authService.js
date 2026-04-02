const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { createToken } = require("../utils/jwtUtil");

exports.login = async (login_id, password) => {
   const rows = await userModel.getUserByLoginId(login_id);

   if(!rows || rows.length === 0) {
     const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
     error.status = 401;
     throw error;
   }

   const user = rows[0];


   const isMatch = await bcrypt.compare(password, user.password);

   if(!isMatch) {
      const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
      error.status = 401;
      throw error;
   }
  
   const accessToken = createToken({
      user_id: user.user_id,
      login_id: user.login_id,
   });

   return {
      message: "로그인 성공",
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
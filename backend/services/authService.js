const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

exports.login = async (login_id, password) => {
   const rows = await userModel.getUserByLoginId(login_id);

   if (rows.length === 0) {
      throw new Error("존재하지 않는 아이디입니다.");
   }

   const user = rows[0];

   const isMatch = await bcrypt.compare(password, user.password);

   if (!isMatch) {
      throw new Error("비밀번호가 일치하지 않습니다.");
   }

   return {
      user: {
         message: "로그인 성공",
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
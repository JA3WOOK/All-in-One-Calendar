const authService = require("../services/authService");

exports.login = async(req, res, next) => {
      try {
         const email = req.body.email ? String(req.body.email).trim() : "";
         const password = req.body.password ? String(req.body.password).trim() : "";

   
         if(!email || !password) {
            return res.status(400).json({
                  message: "아이디와 비밀번호를 입력하세요",
            });
         }

         const result = await authService.login(email, password);

         res.status(200).json(result);
      } catch (err) {
         next(err);
      }
};

// 회원가입
exports.signup = async (req, res, next) => {

   try {
      const body = req.body || {};

      const name = req.body.name ? String(req.body.name).trim() : "";
      const email = req.body.email ? String(req.body.email).trim() : "";
      const password = req.body.password ? String(req.body.password).trim() : "";

      if(!name) {
         return res.status(400).json({ message: "이름을 입력해주세요."});
      }
        if(!email) {
         return res.status(400).json({ message: "이메일을 입력해주세요."});
      }
        if(!password) {
         return res.status(400).json({ message: "비밀번호를 입력해주세요."});
      }

      const result = await authService.signup(name, email, password);
      return res.status(201).json(result);
   
   }catch (err){
      next(err);
   }
};
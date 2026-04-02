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
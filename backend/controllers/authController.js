const authService = require("../services/authService");

exports.login = async(req, res, next) => {
      try {
         const login_id = req.body.login_id ? string(req.body.login_id).trim() : "";
         const password = req.body.password ? string(req.body.password).trim() : "";

         // 입력값 체크
         if(!login_id || !password) {
            return res.status(400).json({
                  message: "아이디와 비밀번호를 입력하세요",
            });
         }

         const result = await authService.login(login_id, password);

         res.status(200).json(result);
      } catch (err) {
         next(err);
      }
};
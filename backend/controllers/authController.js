const authService = require("../services/authService");

exports.login = async(req, res) => {
      try {
         const { login_id, password } = req.body;
         const result = await authService.login(login_id, password);

         res.status(200).json(result);
      } catch (err) {
         res.status(400).json({ message : err.message });
      }
};
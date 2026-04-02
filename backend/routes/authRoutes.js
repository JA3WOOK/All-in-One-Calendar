const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);

router.post("/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "로그아웃 성공",
  });
});

module.exports = router;
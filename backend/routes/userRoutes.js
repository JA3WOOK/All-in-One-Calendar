// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// JWT 인증 필요한 기능
router.get("/me", authMiddleware, userController.getMyProfile);
router.patch("/me", authMiddleware, userController.updateMyProfile);
router.patch("/me/password", authMiddleware, userController.changePassword);
router.delete("/me", authMiddleware, userController.deleteMyAccount);

// 비로그인 상태에서도 가능한 기능
router.post("/password/reset-request", userController.resetPasswordRequest);
router.patch("/password/reset", userController.resetPassword);

module.exports = router;
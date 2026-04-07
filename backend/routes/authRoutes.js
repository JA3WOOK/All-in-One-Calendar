const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post("/forgot-password", authController.requestPasswordReset);
router.patch("/reset-password", authController.resetPasswordWithToken);

module.exports = router;
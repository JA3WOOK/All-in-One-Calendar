const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/login", authController.login);
router.post("/signup", upload.single("profileImage"), authController.signup);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

router.post("/forgot-password", authController.requestPasswordReset);
router.patch("/reset-password", authController.resetPasswordWithToken);

module.exports = router;
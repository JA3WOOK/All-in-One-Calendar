const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// uploads 폴더 없으면 생성
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드 가능합니다."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// JWT 인증 필요한 기능
router.get("/me", authMiddleware, userController.getMyProfile);

router.patch(
  "/me",
  authMiddleware,
  upload.single("profileImage"),
  userController.updateMyProfile
);

router.patch("/me/password", authMiddleware, userController.changePassword);
router.delete("/me", authMiddleware, userController.deleteMyAccount);

// 비로그인 상태에서도 가능한 기능
router.post("/password/reset-request", userController.resetPasswordRequest);
router.patch("/password/reset", userController.resetPassword);

module.exports = router;
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");

const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  createResetToken,
  verifyResetToken,
} = require("../utils/jwtUtil");

const userService = require("./userService");

// 메일 전송기
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// 로그인
exports.login = async (email, password, ip) => {
  if (!email || !password) {
    const error = new Error("아이디와 비밀번호를 입력하세요.");
    error.status = 400;
    throw error;
  }

  const rows = await userModel.getUserByEmail(email);

  console.log("login email:", email);
  console.log("login rows:", rows);

  if (!rows || rows.length === 0) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const user = rows[0];

  console.log("login user:", user);

  if (user.is_deleted) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  console.log("password match:", isMatch);

  if (!isMatch) {
    const error = new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
    error.status = 401;
    throw error;
  }

  const accessToken = createAccessToken({
    user_id: user.user_id,
    email: user.email,
  });

  const refreshToken = createRefreshToken({
    user_id: user.user_id,
    email: user.email,
  });

  // 수정: login 안에 잘못 들어가 있던 RESET TOKEN 로그 삭제
  // console.log("RESET TOKEN:", resetToken);

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  await refreshTokenModel.create(
    user.user_id,
    refreshToken,
    expiryDate,
    ip || null
  );

  return {
    message: "로그인 성공",
    accessToken,
    refreshToken,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      profile_image: user.profile_image,
    },
  };
};

// 회원가입
exports.signup = async (name, email, password, profileImage, profileEmoji) => {
  if (!name || !email || !password) {
    const error = new Error("입력값을 다시 확인해주세요.");
    error.status = 400;
    throw error;
  }

  const existingUserRows = await userModel.getAnyUserByEmail(email);
  const finalProfileImage = profileImage || profileEmoji || null;

  if (existingUserRows && existingUserRows.length > 0) {
    const existingUser = existingUserRows[0];

    // 탈퇴 안 한 계정이면 중복
    if (!existingUser.is_deleted) {
      const error = new Error("이미 사용 중인 이메일입니다.");
      error.status = 409;
      throw error;
    }

    // 탈퇴한 계정이면 복구 처리
    const hashedPassword = await bcrypt.hash(password, 10);

    const restoreResult = await userModel.restoreDeletedUser(
      name,
      email,
      hashedPassword,
      finalProfileImage
    );

    if (!restoreResult || restoreResult.affectedRows === 0) {
      const error = new Error("회원가입 처리 중 오류가 발생했습니다.");
      error.status = 500;
      throw error;
    }

    const restoredUserRows = await userModel.getAnyUserByEmail(email);
    const restoredUser = restoredUserRows[0];

    return {
      message: "회원가입 성공",
      user_id: restoredUser.user_id,
    };
  }

  // 완전 신규 가입
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await userModel.createUser(
    name,
    email,
    hashedPassword,
    finalProfileImage
  );

  return {
    message: "회원가입 성공",
    user_id: result.insertId,
  };
};

// access token 재발급
exports.refresh = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const tokenData = await refreshTokenModel.findByToken(refreshToken);

  if (!tokenData) {
    const error = new Error("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
    error.status = 401;
    throw error;
  }

  if (tokenData.revoked_at) {
    const error = new Error("인증 정보가 유효하지 않습니다.");
    error.status = 401;
    throw error;
  }

  if (new Date(tokenData.expiry_date) < new Date()) {
    const error = new Error("인증 정보가 유효하지 않습니다.");
    error.status = 401;
    throw error;
  }

  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded) {
    const error = new Error("인증 정보가 유효하지 않습니다.");
    error.status = 401;
    throw error;
  }

  const newAccessToken = createAccessToken({
    user_id: decoded.user_id,
    email: decoded.email,
  });

  return {
    message: "로그인 상태가 연장되었습니다.",
    accessToken: newAccessToken,
  };
};

// 로그아웃
exports.logout = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error("로그인이 필요합니다.");
    error.status = 401;
    throw error;
  }

  const savedData = await refreshTokenModel.findByToken(refreshToken);

  if (!savedData) {
    const error = new Error("이미 로그아웃 되었거나 유효하지 않은 요청입니다.");
    error.status = 401;
    throw error;
  }

  await refreshTokenModel.revoke(refreshToken);

  return {
    message: "로그아웃 되었습니다.",
  };
};

// 비밀번호 재설정 링크 요청
exports.requestPasswordReset = async (email) => {
  const user = await userService.findUserByEmail(email);

  if (!user) {
    const error = new Error("존재하지 않는 이메일입니다.");
    error.status = 404;
    throw error;
  }

  const resetToken = createResetToken({
    user_id: user.user_id,
    email: user.email,
  });

  // 추가: 개발 중 토큰 확인용 로그
  console.log("RESET TOKEN:", resetToken);

  const resetLink = `${
    process.env.FRONTEND_URL || "http://localhost:5173"
  }/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: user.email,
    subject: "[All-in-One-Calendar] 비밀번호 재설정 링크",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>비밀번호 재설정</h2>
        <p>아래 버튼을 눌러 비밀번호를 재설정하세요.</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 16px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;">
           비밀번호 재설정
        </a>
        <p style="margin-top:16px;">링크는 15분 동안만 유효합니다.</p>
      </div>
    `,
  });

  return {
    message: "비밀번호 재설정 링크 전송 성공",
    resetLink,
  };
};

// 토큰으로 비밀번호 재설정
exports.resetPasswordWithToken = async (token, newPassword) => {
  const decoded = verifyResetToken(token);

  if (!decoded) {
    const error = new Error("유효하지 않거나 만료된 토큰입니다.");
    error.status = 400;
    throw error;
  }

  const result = await userService.resetPasswordByEmail(
    decoded.email,
    newPassword
  );

  if (!result) {
    // 수정: 같은 비밀번호 재사용 시에도 여기로 들어오므로 메시지 명확화
    const error = new Error("기존 비밀번호와 다른 비밀번호를 입력해주세요.");
    error.status = 400;
    throw error;
  }

  return {
    message: "비밀번호 재설정 성공",
  };
};
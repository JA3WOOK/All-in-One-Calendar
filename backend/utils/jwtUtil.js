const jwt = require("jsonwebtoken");

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET 환경변수 설정 안됨");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET 환경변수 설정 안됨");
}

if (!process.env.JWT_RESET_SECRET) {
  throw new Error("JWT_RESET_SECRET 환경변수 설정 안됨");
}

// access token 생성
exports.createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  });
};

// refresh token 생성
exports.createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

// reset password token 생성
exports.createResetToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_RESET_SECRET, {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
  });
};

// access token 검증
exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

// refresh token 검증
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

// reset password token 검증
exports.verifyResetToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_RESET_SECRET);
  } catch (err) {
    return null;
  }
};
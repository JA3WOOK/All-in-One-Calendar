const { verifyAccessToken } = require("../utils/jwtUtil");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "토큰 없음" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ message: "토큰 형식 오류" });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "유효하지 않은 토큰" });
    }

    req.user = {
      user_id: decoded.user_id,
    };

    next();
  } catch (error) {
    console.error("JWT ERROR:", error.message);
    return res.status(401).json({ message: "유효하지 않은 토큰" });
  }
};

module.exports = authMiddleware;
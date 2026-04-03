const authService = require("../services/authService");

// 로그인
exports.login = async (req, res, next) => {
  try {
    const email = req.body.email ? String(req.body.email).trim() : "";
    const password = req.body.password ? String(req.body.password).trim() : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "아이디와 비밀번호를 입력하세요",
      });
    }

    const result = await authService.login(email, password, req.ip);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 회원가입
exports.signup = async (req, res, next) => {
  try {
    const name = req.body.name ? String(req.body.name).trim() : "";
    const email = req.body.email ? String(req.body.email).trim() : "";
    const password = req.body.password ? String(req.body.password).trim() : "";

    if (!name) {
      return res.status(400).json({ message: "이름을 입력해주세요." });
    }
    if (!email) {
      return res.status(400).json({ message: "이메일을 입력해주세요." });
    }
    if (!password) {
      return res.status(400).json({ message: "비밀번호를 입력해주세요." });
    }

    const result = await authService.signup(name, email, password);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// refresh
exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken
      ? String(req.body.refreshToken).trim()
      : "";

    if (!refreshToken) {
      return res.status(400).json({
        message: "refreshToken을 입력하세요",
      });
    }

    const result = await authService.refresh(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 로그아웃
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken
      ? String(req.body.refreshToken).trim()
      : "";

    if (!refreshToken) {
      return res.status(400).json({
        message: "refreshToken을 입력하세요",
      });
    }

    const result = await authService.logout(refreshToken);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 비밀번호 재설정 링크 요청
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const email = req.body.email ? String(req.body.email).trim() : "";

    if (!email) {
      return res.status(400).json({
        message: "이메일을 입력하세요",
      });
    }

    const result = await authService.requestPasswordReset(email);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// 토큰으로 비밀번호 재설정
exports.resetPasswordWithToken = async (req, res, next) => {
  try {
    const token = req.body.token ? String(req.body.token).trim() : "";
    const newPassword = req.body.newPassword
      ? String(req.body.newPassword).trim()
      : "";

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "토큰과 새 비밀번호를 입력하세요",
      });
    }

    const result = await authService.resetPasswordWithToken(
      token,
      newPassword
    );
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
const userService = require("../services/userService");
const authService = require("../services/authService");

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    res.status(200).json({
      success: true,
      message: "프로필 조회 성공",
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, phone, department, profile_image } = req.body;

    const updatedUser = await userService.updateUserProfile(userId, {
      name,
      phone,
      department,
      profile_image,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    res.status(200).json({
      success: true,
      message: "프로필 수정 성공",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "비밀번호 입력 필요" });
    }

    const result = await userService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    if (!result) {
      return res.status(400).json({ message: "현재 비밀번호 틀림" });
    }

    res.status(200).json({ message: "비밀번호 변경 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await userService.deleteUserById(userId);

    if (!result) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    res.status(200).json({ message: "회원 탈퇴 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const resetPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "서버 오류",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "token, newPassword 필요" });
    }

    const result = await authService.resetPasswordWithToken(token, newPassword);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      message: error.message || "서버 오류",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  deleteMyAccount,
  resetPassword,
  resetPasswordRequest,
};
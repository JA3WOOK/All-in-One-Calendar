// controllers/userController.js
const userService = require("../services/userService");

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

    if (!email) {
      return res.status(400).json({ message: "email 필요" });
    }

    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: "해당 이메일 사용자가 없음" });
    }

    res.status(200).json({
      message: "재설정 가능한 사용자 확인 완료",
      data: {
        user_id: user.user_id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "email, newPassword 필요" });
    }

    const result = await userService.resetPasswordByEmail(email, newPassword);

    if (!result) {
      return res.status(404).json({ message: "해당 이메일 사용자가 없음" });
    }

    res.status(200).json({ message: "비밀번호 재설정 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류" });
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
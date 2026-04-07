import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../../api/authApi";
import Modal from "../../components/Modal";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const token = query.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const openModal = (title, message, success = false) => {
    setModalTitle(title);
    setModalMessage(message);
    setIsSuccess(success);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);

    if (isSuccess) {
      navigate("/login");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      openModal(
        "유효하지 않은 링크",
        "유효하지 않거나 만료된 링크입니다.\n다시 비밀번호 재설정을 요청해주세요."
      );
      return;
    }

    if (!newPassword || !confirmPassword) {
      openModal("입력 오류", "모든 값을 입력해주세요.");
      return;
    }

    if (newPassword.length < 8) {
      openModal("입력 오류", "비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      openModal("입력 오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      const result = await resetPasswordApi({
        token,
        newPassword,
      });

      openModal(
        "비밀번호 변경 완료",
        result.message || "비밀번호가 성공적으로 변경되었습니다.",
        true
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "비밀번호 재설정 실패";
      openModal("변경 실패", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="reset-container">
        <div className="reset-left">
          <div className="reset-brand-title">Graph UP</div>

          <div className="reset-brand-subtitle">
            팀을 연결하고, <span>일정을 함께 완성하세요</span>
          </div>

          <div className="reset-brand-description">
            초대와 권한 관리로, 협업을 더 쉽게 만드세요
          </div>

          <div className="reset-brand-image-card">
            <img
              src="/icons/reset-preview.png"
              alt="협업 미리보기"
              className="reset-brand-preview-image"
            />
          </div>
        </div>

        <div className="reset-right">
          <button
            type="button"
            className="reset-back-button"
            onClick={() => navigate(-1)}
          >
            ← 이전으로 돌아가기
          </button>

          <div className="reset-security-icon-box">
            <img src="/icons/lock-icon.png" alt="보안 아이콘" />
          </div>

          <h1 className="reset-page-title">새 비밀번호 설정</h1>

          <p className="reset-page-description">
            안전한 새 비밀번호를 입력해주세요.
            <br />
            이전 비밀번호와 다르게 설정하는 것을 권장합니다.
          </p>

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="reset-input-group">
              <label htmlFor="newPassword">새 비밀번호</label>

              <div className="reset-input-wrap">
                <span className="reset-input-icon">🔒</span>
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="8자 이상 입력하세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="reset-eye-button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  👁
                </button>
              </div>
            </div>

            <div className="reset-input-group">
              <label htmlFor="confirmPassword">비밀번호 확인</label>

              <div className="reset-input-wrap">
                <span className="reset-input-icon">🔒</span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="reset-eye-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  👁
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="reset-primary-button"
              disabled={loading}
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      />
    </>
  );
}
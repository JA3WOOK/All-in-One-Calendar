import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPasswordApi } from "../../api/authApi";
import Modal from "../../components/Modal";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const handleOpenModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalTitle("");
    setModalMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      handleOpenModal("알림", "이메일을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const result = await forgotPasswordApi({ email });

      handleOpenModal(
        "이메일을 확인해주세요",
        result.message || "비밀번호 재설정 링크를 전송했습니다."
      );
    } catch (error) {
      const message =
        error.response?.data?.message || "비밀번호 재설정 요청 실패";

      handleOpenModal("요청 실패", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="forgot-container">
        <div className="forgot-left">
          <div className="forgot-brand-title">Graph UP</div>

          <div className="forgot-brand-subtitle">
            기록을 넘어, <span>패턴을 발견하세요</span>
          </div>

          <div className="forgot-brand-description">
            운동률, 패턴, 카테고리별 통계를 한눈에 확인하세요
          </div>

          <div className="forgot-brand-image-card">
            <img
              src="/icons/forgot-preview.png"
              alt="통계 미리보기"
              className="forgot-brand-preview-image"
            />
          </div>
        </div>

        <div className="forgot-right">
          <button
            type="button"
            className="forgot-back-button"
            onClick={() => navigate("/login")}
          >
            ← 로그인으로 돌아가기
          </button>

          <div className="forgot-security-icon-box">
            <img src="/icons/lock-icon.png" alt="보안 아이콘" />
          </div>

          <h1 className="forgot-page-title">비밀번호를 잊으셨나요?</h1>

          <p className="forgot-page-description">
            가입한 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다
          </p>

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="forgot-input-group">
              <label htmlFor="email">이메일 주소</label>

              <div className="forgot-input-wrap">
                <span className="forgot-input-icon">✉</span>
                <input
                  id="email"
                  type="email"
                  placeholder="your@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <small>가입 시 사용한 이메일 주소를 입력해주세요</small>
            </div>

            <button
              type="submit"
              className="forgot-primary-button"
              disabled={loading}
            >
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </button>
          </form>

          <p className="forgot-bottom-link-text">
            아직 계정이 없으신가요?{" "}
            <span onClick={() => navigate("/signup")}>회원가입 하기</span>
          </p>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        title={modalTitle}
        message={modalMessage}
        onClose={handleCloseModal}
      />
    </>
  );
}
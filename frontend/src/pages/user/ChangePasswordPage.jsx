import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { changeMyPasswordApi } from "../../api/userApi";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("모든 값을 입력해주세요.");
      return;
    }

    if (newPassword.length < 8) {
      alert("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);

      const result = await changeMyPasswordApi({
        currentPassword,
        newPassword,
      });

      alert(result.message || "비밀번호 변경 성공");
      navigate("/mypage");
    } catch (error) {
      const message =
        error.response?.data?.message || "비밀번호 변경 실패";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-shell">
      <div className="settings-container">
        <button
          className="settings-back-btn"
          onClick={() => navigate("/mypage")}
        >
          <ArrowLeft size={16} />
          <span>마이페이지</span>
        </button>

        <div className="settings-page-header">
          <h1>비밀번호 변경</h1>
          <p>계정 보안을 위해 새 비밀번호를 설정하세요.</p>
        </div>

        <section className="settings-section">
          <div className="settings-section-header">
            <h2>보안 설정</h2>
            <p>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</p>
          </div>

          <form className="settings-form" onSubmit={handleSubmit}>
            <div className="settings-field">
              <label htmlFor="currentPassword">현재 비밀번호</label>
              <div className="settings-input-wrap">
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="현재 비밀번호 입력"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label="현재 비밀번호 보기"
                >
                  {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="newPassword">새 비밀번호</label>
              <div className="settings-input-wrap">
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="8자 이상 입력"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowNew(!showNew)}
                  aria-label="새 비밀번호 보기"
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="settings-field">
              <label htmlFor="confirmPassword">새 비밀번호 확인</label>
              <div className="settings-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="새 비밀번호 다시 입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="settings-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="비밀번호 확인 보기"
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="settings-help-text">
              비밀번호는 8자 이상으로 입력하세요. 영문, 숫자, 특수문자를 함께 사용하면 더 안전합니다.
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="secondary-action-btn"
                onClick={() => navigate("/mypage")}
              >
                취소
              </button>
              <button
                type="submit"
                className="primary-action-btn"
                disabled={loading}
              >
                {loading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
import { useState } from "react";
import "./ResetPasswordPage.css";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
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

    console.log("비밀번호 재설정", { newPassword });
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <h1 className="reset-title">새 비밀번호 설정</h1>
        <p className="reset-description">
          새로운 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="reset-input-group">
            <label htmlFor="resetNewPassword">새 비밀번호</label>
            <input
              id="resetNewPassword"
              type="password"
              placeholder="8자 이상 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="reset-input-group">
            <label htmlFor="resetConfirmPassword">새 비밀번호 확인</label>
            <input
              id="resetConfirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="reset-btn">
            비밀번호 재설정
          </button>
        </form>
      </div>
    </div>
  );
}
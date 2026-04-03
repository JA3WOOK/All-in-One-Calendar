import { useState } from "react";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    console.log("비밀번호 재설정 링크 요청", email);
    setIsSubmitted(true);
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        {!isSubmitted ? (
          <>
            <h1 className="forgot-title">비밀번호 재설정</h1>
            <p className="forgot-description">
              가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </p>

            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="forgot-input-group">
                <label htmlFor="forgotEmail">이메일</label>
                <input
                  id="forgotEmail"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="forgot-btn">
                재설정 링크 보내기
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="forgot-title">이메일을 확인해주세요</h1>
            <p className="forgot-description">
              입력한 이메일로 비밀번호 재설정 링크를 보냈습니다.
            </p>

            <button
              type="button"
              className="forgot-btn"
              onClick={() => setIsSubmitted(false)}
            >
              다시 입력하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
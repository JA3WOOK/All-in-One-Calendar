import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import "../styles/auth.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (!form.email.trim() || !form.password.trim()) {
      setIsError(true);
      setMessage("이메일과 비밀번호를 입력하세요.");
      return;
    }

    try {
      const data = await loginApi(form);

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage(data.message || "로그인 성공");

      // 로그인 성공 후 이동
      setTimeout(() => {
        navigate("/calender");
      }, 800);
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.message || "로그인 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="calendar-preview"></div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tab">
            <div className="auth-tab-item active">로그인</div>
            <div
              className="auth-tab-item"
              onClick={() => navigate("/signup")}
            >
              회원가입
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                placeholder="your@gmail.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                className="form-input"
                type="password"
                name="password"
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={handleChange}
              />
              <div className="helper-link">비밀번호를 잊으셨나요?</div>
            </div>

            <button className="auth-btn" type="submit">
              로그인
            </button>

            <div className="auth-bottom-text">
              아직 계정이 없으신가요?{" "}
              <span onClick={() => navigate("/signup")}>회원가입</span>
            </div>

            {message && (
              <div className={isError ? "error-text" : "success-text"}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
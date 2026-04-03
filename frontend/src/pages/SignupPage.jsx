import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupApi } from "../api/authApi";
import "../styles/auth.css";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("👤");

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

    if (form.password.length < 8) {
      setIsError(true);
      setMessage("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setIsError(true);
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
      };

      const data = await signupApi(payload);
      setMessage(data.message || "회원가입 성공");

      setForm({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
    }
  };

  const profiles = ["👤", "🧑", "👨", "👩", "🙂"];

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">Graph UP</div>

        <div className="profile-preview-wrap">
          <div className="profile-preview-title">프로필 이미지 설정</div>
          <div className="profile-preview-desc">
            사용할 프로필 이미지를 선택하세요
          </div>

          <div className="profile-circle">{selectedProfile}</div>

          <button type="button" className="profile-upload-btn">
            선택 완료
          </button>

          <div className="profile-thumb-list">
            {profiles.map((profile) => (
              <div
                key={profile}
                className="profile-thumb"
                onClick={() => setSelectedProfile(profile)}
              >
                {profile}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-tab">
          <div className="auth-tab-item" onClick={() => navigate("/login")}>
            로그인
          </div>
          <div className="auth-tab-item active">회원가입</div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="홍길동"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="your@gmail.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="8자 이상 입력하세요"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              className="form-input"
              type="password"
              name="passwordConfirm"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.passwordConfirm}
              onChange={handleChange}
            />
          </div>

          <button className="auth-btn" type="submit">
            계정 만들기
          </button>

          <div className="auth-bottom-text">
            이미 계정이 있으신가요?{" "}
            <span onClick={() => navigate("/login")}>로그인 하기</span>
          </div>

          {message && (
            <div className={isError ? "error-text" : "success-text"}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
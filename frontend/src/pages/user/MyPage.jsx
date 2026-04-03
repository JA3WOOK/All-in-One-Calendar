import { useNavigate } from "react-router-dom";
import "./MyPage.css";

export default function MyPage() {
  const navigate = useNavigate();

  const user = {
    name: "수빈",
    email: "test@test.com",
    profileImage: "",
  };

  return (
    <div className="mypage-page">
      <div className="mypage-card">
        <div className="mypage-profile-section">
          <div className="mypage-profile-image-wrapper">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="프로필"
                className="mypage-profile-image"
              />
            ) : (
              <div className="mypage-profile-placeholder">👤</div>
            )}
          </div>

          <button type="button" className="mypage-image-edit-btn">
            이미지 편집
          </button>

          <h1 className="mypage-user-name">{user.name}</h1>
          <p className="mypage-user-email">{user.email}</p>
        </div>

        <div className="mypage-menu-section">
          <button
            type="button"
            className="mypage-menu-btn"
            onClick={() => navigate("/edit-profile")}
          >
            정보 수정
          </button>

          <button
            type="button"
            className="mypage-menu-btn"
            onClick={() => navigate("/change-password")}
          >
            비밀번호 변경
          </button>
        </div>

        <div className="mypage-action-section">
          <button type="button" className="mypage-logout-btn">
            로그아웃
          </button>

          <button type="button" className="mypage-delete-btn">
            계정삭제
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  LogOut,
  Lock,
  PencilLine,
  Trash2,
  UserRound,
  CalendarDays,
} from "lucide-react";
import { logoutApi } from "../../api/authApi";
import { deleteMyAccountApi, getMyProfileApi } from "../../api/userApi";
import "./MyPage.css";

const BACKEND_URL = "http://localhost:3001";

export default function MyPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    profile_image: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getMyProfileApi();

        // 응답이 { success, message, data } 형태일 수도 있고
        // 그냥 user 객체일 수도 있어서 둘 다 대응
        const userData = result.data ?? result;

        setUser(userData);
      } catch (error) {
        alert(error.response?.data?.message || "프로필 불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.log("로그아웃 API 실패", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm("정말 계정을 삭제하시겠습니까?");
    if (!ok) return;

    try {
      const result = await deleteMyAccountApi();
      alert(result.message || "회원 탈퇴 성공");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "회원 탈퇴 실패");
    }
  };

  if (loading) {
    return (
      <div className="mypage-shell">
        <div className="mypage-loading">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="mypage-shell">
      <div className="mypage-card">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => navigate("/calendar")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "none",
              color: "#6b7280",
              fontSize: 14,
              cursor: "pointer",
              padding: "4px 0",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#111827")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
          >
            <CalendarDays size={16} />
            <span>캘린더로 돌아가기</span>
          </button>
        </div>

        <div className="mypage-profile-section">
          <div className="mypage-avatar-wrap">
            {user.profile_image ? (
              <img
                src={
                  user.profile_image.startsWith("http")
                    ? user.profile_image
                    : `${BACKEND_URL}${user.profile_image}`
                }
                alt="profile"
                className="mypage-avatar"
              />
            ) : (
              <div className="mypage-avatar fallback">
                <UserRound size={40} />
              </div>
            )}
          </div>

          <h1 className="mypage-name">{user.name || "이름 없음"}</h1>
          <p className="mypage-email">{user.email || "이메일 없음"}</p>
        </div>

        <div className="mypage-info-box">
          <div className="mypage-info-row">
            <span>전화번호</span>
            <strong>{user.phone || "등록되지 않음"}</strong>
          </div>
          <div className="mypage-info-row">
            <span>부서</span>
            <strong>{user.department || "등록되지 않음"}</strong>
          </div>
        </div>

        <div className="mypage-menu">
          <button
            className="mypage-menu-btn"
            onClick={() => navigate("/edit-profile")}
          >
            <div className="mypage-menu-left">
              <PencilLine size={17} />
              <span>정보 수정</span>
            </div>
            <ChevronRight size={17} />
          </button>

          <button
            className="mypage-menu-btn"
            onClick={() => navigate("/change-password")}
          >
            <div className="mypage-menu-left">
              <Lock size={17} />
              <span>비밀번호 변경</span>
            </div>
            <ChevronRight size={17} />
          </button>

          <button className="mypage-menu-btn" onClick={handleLogout}>
            <div className="mypage-menu-left">
              <LogOut size={17} />
              <span>로그아웃</span>
            </div>
            <ChevronRight size={17} />
          </button>
        </div>

        <button className="mypage-delete-btn" onClick={handleDeleteAccount}>
          <Trash2 size={15} />
          <span>계정 삭제</span>
        </button>
      </div>
    </div>
  );
}
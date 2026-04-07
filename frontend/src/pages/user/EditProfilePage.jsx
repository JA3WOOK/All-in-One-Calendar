import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, UserRound } from "lucide-react";
import { getMyProfileApi, updateMyProfileApi } from "../../api/userApi";
import "./EditProfilePage.css";

export default function EditProfilePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getMyProfileApi();
        const user = result;

        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setDepartment(user.department || "");
        setProfileImage(user.profile_image || "");
        setPreviewImage(user.profile_image || "");
      } catch (error) {
        alert(error.response?.data?.message || "프로필 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
    setProfileImage(imageUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const result = await updateMyProfileApi({
        name,
        phone: phone || null,
        department: department || null,
        profile_image: profileImage || null,
      });

      alert(result.message || "프로필 수정 성공");
      navigate("/mypage");
    } catch (error) {
      alert(error.response?.data?.message || "프로필 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-settings-shell">
        <div className="profile-settings-loading">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="profile-settings-shell">
      <div className="profile-settings-container">
        <button
          className="profile-settings-back-btn"
          onClick={() => navigate("/mypage")}
        >
          <ArrowLeft size={16} />
          <span>마이페이지</span>
        </button>

        <div className="profile-settings-page-header">
          <h1>정보 수정</h1>
          <p>계정에 표시되는 기본 정보를 수정할 수 있습니다.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <section className="profile-settings-section">
            <div className="profile-settings-section-header">
              <h2>프로필</h2>
              <p>프로필 이미지와 기본 표시 정보를 관리합니다.</p>
            </div>

            <div className="profile-settings-profile-row">
              <div className="profile-settings-avatar-wrap">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="profile"
                    className="profile-settings-avatar"
                  />
                ) : (
                  <div className="profile-settings-avatar fallback">
                    <UserRound size={28} />
                  </div>
                )}
              </div>

              <div className="profile-settings-profile-meta">
                <strong>{name || "이름 없음"}</strong>
                <span>{email || "이메일 없음"}</span>
              </div>

              <label className="profile-settings-image-btn">
                <Camera size={15} />
                <span>사진 변경</span>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </section>

          <section className="profile-settings-section">
            <div className="profile-settings-section-header">
              <h2>기본 정보</h2>
              <p>연락처와 소속 정보를 입력할 수 있습니다.</p>
            </div>

            <div className="profile-settings-form">
              <div className="profile-settings-field">
                <label htmlFor="name">이름</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
                />
              </div>

              <div className="profile-settings-field">
                <label htmlFor="email">이메일</label>
                <input id="email" value={email} disabled />
              </div>

              <div className="profile-settings-field">
                <label htmlFor="phone">전화번호</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="전화번호 입력"
                />
              </div>

              <div className="profile-settings-field">
                <label htmlFor="department">부서</label>
                <input
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="부서 입력"
                />
              </div>

              <div className="profile-settings-actions">
                <button
                  type="button"
                  className="profile-secondary-action-btn"
                  onClick={() => navigate("/mypage")}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="profile-primary-action-btn"
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}
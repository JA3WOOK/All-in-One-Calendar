import { useState } from "react";
import "./EditProfilePage.css";

export default function EditProfilePage() {
  const [name, setName] = useState("수빈");
  const [email] = useState("test@test.com");
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("저장 요청", { name, email, profileImage });
  };

  return (
    <div className="edit-page">
      <div className="edit-card">
        <h1 className="edit-title">정보 수정</h1>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="edit-profile-section">
            <div className="edit-profile-image-wrapper">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="프로필 미리보기"
                  className="edit-profile-image"
                />
              ) : (
                <div className="edit-profile-placeholder">👤</div>
              )}
            </div>

            <label className="edit-image-btn">
              이미지 변경
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
            </label>
          </div>

          <div className="edit-input-group">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="edit-input-group">
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" value={email} disabled />
          </div>

          <button type="submit" className="edit-save-btn">
            저장
          </button>
        </form>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupApi } from "../api/authApi";
import ProfileImageCropModal from "./ProfileImageCropModal";
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
  const [uploadError, setUploadError] = useState("");

  const [selectedProfile, setSelectedProfile] = useState("👤");
  const [uploadedProfiles, setUploadedProfiles] = useState([]);

  // 🔥 추가된 state
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  const profiles = ["👤", "🧑", "👩", null];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 
  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (uploadedProfiles.length >= 2) {
      setUploadError("이미지는 최대 2개까지 업로드할 수 있습니다.");
      return;
    }

    const preview = URL.createObjectURL(file);

  
    setImageSrc(preview);
    setShowCropModal(true);

    e.target.value = "";
  };


  const handleCropComplete = (croppedImage) => {
    const newImage = {
      file: null,
      preview: croppedImage,
    };

    setUploadedProfiles((prev) => [...prev, newImage]);
    setSelectedProfile(croppedImage);

    setShowCropModal(false);
    setImageSrc(null);
  };

  
  const handleRemoveUploadedProfile = (previewToRemove) => {
    setUploadedProfiles((prev) => {
      const updated = prev.filter((item) => item.preview !== previewToRemove);

      if (selectedProfile === previewToRemove) {
        setSelectedProfile("👤");
      }

      return updated;
    });

    setUploadError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.passwordConfirm.trim()
    ) {
      setIsError(true);
      setMessage("모든 항목을 입력해주세요.");
      return;
    }

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
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);

      const selectedUploadedImage = uploadedProfiles.find(
        (item) => item.preview === selectedProfile
      );

      if (selectedUploadedImage && selectedUploadedImage.file) {
        formData.append("profileImage", selectedUploadedImage.file);
      } else {
        formData.append("profileEmoji", selectedProfile);
      }

      const data = await signupApi(formData);

      setMessage(data.message || "회원가입 성공");
      setIsError(false);
      setUploadError("");

      setForm({
        name: "",
        email: "",
        password: "",
        passwordConfirm: "",
      });

      setSelectedProfile("👤");
      setUploadedProfiles([]);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      setIsError(true);
      setMessage(
        err.response?.data?.message || "회원가입 중 오류가 발생했습니다."
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">Graph UP</div>

        <div className="profile-preview-wrap">
          <div className="profile-preview-title">프로필 이미지 설정</div>
          <div className="profile-preview-desc">
            사용할 프로필 이미지를 선택하세요
          </div>

          <div className="profile-circle">
            {selectedProfile?.startsWith?.("blob:") ? (
              <img
                src={selectedProfile}
                alt="프로필 미리보기"
                className="profile-preview-img"
              />
            ) : (
              selectedProfile
            )}
          </div>

          <label htmlFor="profile-upload" className="profile-upload-btn">
            이미지 파일 업로드
          </label>

          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleProfileUpload}
            style={{ display: "none" }}
          />

          {uploadError && (
            <div className="upload-error-text">{uploadError}</div>
          )}

          <div className="profile-thumb-list">
            {profiles.map((profile, index) => {
              let value = profile;
              let imageData = null;

              if (profile === null) {
                imageData = uploadedProfiles[0] || null;
                value = imageData ? imageData.preview : null;
              }

              return (
                <div
                  key={`profile-${index}`}
                  className={`profile-thumb ${
                    selectedProfile === value ? "selected" : ""
                  }`}
                  onClick={() => {
                    if (value) setSelectedProfile(value);
                  }}
                >
                  {imageData ? (
                    <div className="profile-thumb-image-wrap">
                      <img
                        src={imageData.preview}
                        alt="업로드 프로필"
                        className="profile-thumb-img"
                      />
                      <button
                        type="button"
                        className="profile-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveUploadedProfile(imageData.preview);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : profile === null ? null : profile
                  }
                </div>
              );
            })}

            {uploadedProfiles[1] && (
              <div
                className={`profile-thumb ${
                  selectedProfile === uploadedProfiles[1].preview
                    ? "selected"
                    : ""
                }`}
                onClick={() => setSelectedProfile(uploadedProfiles[1].preview)}
              >
                <div className="profile-thumb-image-wrap">
                  <img
                    src={uploadedProfiles[1].preview}
                    alt="업로드 프로필"
                    className="profile-thumb-img"
                  />
                  <button
                    type="button"
                    className="profile-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveUploadedProfile(
                        uploadedProfiles[1].preview
                      );
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
{/* */}
      <div className="auth-right">
        <div className="auth-card">
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
                placeholder="이름"
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
                placeholder="your@email.com"
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
                placeholder="8자리 이상 입력해주세요."
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
                placeholder="8자리 이상 입력해주세요."
                value={form.passwordConfirm}
                onChange={handleChange}
              />
            </div>

            <button className="auth-btn" type="submit">
              계정 만들기
            </button>

            {message && (
              <div className={isError ? "error-text" : "success-text"}>
                {message}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 크롭 모달 */}
      {showCropModal && (
        <ProfileImageCropModal
          imageSrc={imageSrc}
          onClose={() => setShowCropModal(false)}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
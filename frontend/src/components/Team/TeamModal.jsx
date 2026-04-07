// 그룹 생성,수정
import { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";


function TeamModal({ selectedTeam: propTeam, onClose, onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. [해결] props로 받은 데이터가 없으면, navigate의 state에서 가져옵니다.
  // 변수명 중복 에러를 피하기 위해 propTeam이라는 이름을 썼어요.
  const selectedTeam = propTeam || location.state?.selectedTeam;
  const isEditMode = !!selectedTeam;

  // 기본 상태
  const [team, setTeam] = useState({
    team_name: "",
    team_color: "#4A90E2",
    description: ""
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeam((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (isEditMode) {
        // 수정
        response = await axios.put(`/api/teams/${team.team_id}`, team);
      } else {
        // 생성 
        response = await axios.post("/api/teams", team);
      }

      if (response) {
        alert(isEditMode ? "그룹 수정 완료" : "그룹 생성 완료");
        
        if (typeof onRefresh === 'function') {
          onRefresh();
        }
        
        // 모달 닫기 로직 (라우팅으로 왔으면 뒤로가기, 아니면 onClose 실행)
        if (location.state?.backgroundLocation) {
          navigate(-1);
        } else if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error("작업 실패 상세", err);
      alert("오류 발생" + (err.response?.data?.message || "서버 통신 오류"));
    }
  };

  return (
    <div style={overlayStyle} onClick={() => (onClose ? onClose() : navigate(-1))}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>
          {isEditMode ? "그룹 정보 수정" : "새 그룹 등록"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>그룹명</label>
            <input 
              type="text" 
              name="team_name" 
              value={team.team_name} 
              onChange={handleChange} 
              style={inputStyle}
              required
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>그룹 색상</label>
            <input 
              type="color" 
              name="team_color" 
              value={team.team_color} 
              onChange={handleChange} 
              style={colorInputStyle}
            />
          </div>

          <div style={inputGroupStyle}>
            <label style={labelStyle}>그룹 설명</label>
            <textarea 
              name="description" 
              value={team.description} 
              onChange={handleChange} 
              style={{ ...inputStyle, height: "100px", resize: "none" }}
            />
          </div>

          <div style={btnAreaStyle}>
            <button 
              type="button" 
              onClick={() => (onClose ? onClose() : navigate(-1))} 
              style={cancelBtnStyle}
            >
              취소
            </button>
            <button 
              type="submit" 
              style={{ ...submitBtnStyle, backgroundColor: "#b5b7ba" }}
            >
              {isEditMode ? "수정 완료" : "생성하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 스타일 
const overlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalStyle = { backgroundColor: "#fff", padding: "30px", borderRadius: "20px", width: "380px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" };
const titleStyle = { marginBottom: "20px", fontSize: "20px", fontWeight: "bold" };
const inputGroupStyle = { marginBottom: "15px", textAlign: "left" };
const labelStyle = { display: "block", marginBottom: "5px", fontSize: "14px", fontWeight: "600" };
const inputStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" };
const colorInputStyle = { width: "40px", height: "40px", border: "none", borderRadius: "50%", cursor: "pointer", padding: 0 };
const btnAreaStyle = { display: "flex", gap: "10px", marginTop: "25px" };
const cancelBtnStyle = { flex: 1, padding: "12px", border: "none", borderRadius: "8px", backgroundColor: "#eee", cursor: "pointer" };
const submitBtnStyle = { flex: 1, padding: "12px", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "bold", cursor: "pointer" };

export default TeamModal;
import { useState } from "react";
import API from '../../api/axios';
import { useLocation, useNavigate } from "react-router-dom";

const TEAM_COLOR_PALETTE = [
    '#4a80c4', '#1e88e5', '#0097a7', '#00acc1', '#00897b',
    '#7c3aed', '#9c27b0', '#d81b60', '#e53935', '#f4511e',
    '#e67e22', '#546e7a', '#37474f', '#6d4c41', '#ff7043',
    '#43a047', '#558b2f', '#1565c0', '#6a1b9a', '#ad1457',
];

function TeamModal({ selectedTeam: propTeam, onClose, onRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedTeam = propTeam || location.state?.selectedTeam;
  const isEditMode = !!selectedTeam;

  const [team, setTeam] = useState({
    team_id: selectedTeam?.team_id || null,
    team_name: selectedTeam?.team_name || "",
    team_color: selectedTeam?.team_color || "#4a80c4",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeam((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!team.team_name.trim()) { alert('그룹 이름을 입력해주세요.'); return; }
    try {
      let response;
      if (isEditMode) {
        response = await API.put(`/api/teams/${team.team_id}`, {
          name: team.team_name.trim(),
          team_color: team.team_color,
        });
      } else {
        response = await API.post("/api/teams", {
          name: team.team_name.trim(),
          team_color: team.team_color,
        });
      }

      if (response) {
        alert(isEditMode ? "그룹 수정 완료" : "그룹 생성 완료");
        if (typeof onRefresh === 'function') onRefresh();
        if (location.state?.backgroundLocation) {
          navigate(-1);
        } else if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error("작업 실패 상세", err);
      alert("오류 발생: " + (err.response?.data?.message || "서버 통신 오류"));
    }
  };

  return (
    <div style={overlayStyle} onClick={() => (onClose ? onClose() : navigate(-1))}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#2d2d2d' }}>
            {isEditMode ? "✏️ 그룹 수정" : "👥 새 그룹 추가"}
          </span>
          <button onClick={() => (onClose ? onClose() : navigate(-1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 그룹명 */}
          <label style={labelStyle}>그룹 이름</label>
          <input
            type="text"
            name="team_name"
            value={team.team_name}
            onChange={handleChange}
            placeholder="예: 개발팀, 스터디 모임"
            style={inputStyle}
            required
          />

          {/* 색상 팔레트 */}
          <label style={labelStyle}>팀 색상</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 6 }}>
            {TEAM_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setTeam(prev => ({ ...prev, team_color: color }))}
                title={color}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: color, border: 'none', cursor: 'pointer',
                  transition: 'transform 0.1s',
                  transform: team.team_color === color ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: team.team_color === color ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none',
                }}
              />
            ))}
          </div>

          {/* hex 직접 입력 + 컬러 피커 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: team.team_color, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
            <input
              type="text"
              value={team.team_color}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setTeam(prev => ({ ...prev, team_color: v }));
              }}
              placeholder="#hex"
              maxLength={7}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', letterSpacing: '0.05em', fontFamily: 'monospace' }}
            />
            <input
              type="color"
              value={team.team_color.length === 7 ? team.team_color : '#4a80c4'}
              onChange={(e) => setTeam(prev => ({ ...prev, team_color: e.target.value }))}
              style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer', padding: 2 }}
              title="색상 직접 선택"
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => (onClose ? onClose() : navigate(-1))} style={cancelBtnStyle}>취소</button>
            <button type="submit" style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: team.team_color.length === 7 ? team.team_color : '#4a80c4',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>
              {isEditMode ? "수정 완료" : "생성하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.14)', padding: '24px 24px 20px' };
const labelStyle = { fontSize: 12, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 6 };
const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, marginBottom: 20, padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none' };
const cancelBtnStyle = { padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer' };

export default TeamModal;
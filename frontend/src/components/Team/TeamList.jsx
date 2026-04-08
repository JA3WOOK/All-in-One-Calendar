// 그룹 목록 보여주기, 관리
import { useState, useEffect } from "react";
import API from '../../api/axios';

function TeamList({ showAdminButtons = false, reloadKey, setReloadKey, onEdit, onViewMembers }) {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await API.get('/api/teams');
        setTeams(response.data);
      } catch (err) {
        console.error("그룹 목록 불러오기 실패", err);
      }
    };
    fetchTeams();
  }, [reloadKey]);

  const handleDelete = async (team_id) => {
    if (window.confirm("이 그룹을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
      try {
        await API.delete(`/api/teams/${team_id}`);
        alert("삭제되었습니다.");
        if (setReloadKey) setReloadKey(prev => prev + 1);
      } catch (err) {
        console.error("삭제 실패", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handleEditClick = (team) => {
    if (team.role === 'VIEWER') {
      alert('수정 권한이 없습니다. (OWNER 또는 EDITOR만 가능)');
      return;
    }
    if (onEdit) onEdit(team);
  };

  const handleMemberClick = (team) => {
    if (team.role === 'VIEWER') {
      alert('멤버 관리 권한이 없습니다. (OWNER만 가능)');
      return;
    }
    if (onViewMembers) onViewMembers(team);
  };

  return (
      <div style={listContainerStyle}>
        {teams.length > 0 ? (
            teams.map((team) => (
                <div key={team.team_id} style={{ ...listItemStyle, borderLeft: `6px solid ${team.team_color || '#4a80c4'}` }}>
                  <div style={infoStyle}>
                    <strong style={nameStyle}>{team.team_name}</strong>
                    <p style={descStyle}>{team.description}</p>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>내 역할: {team.role || 'VIEWER'}</span>
                  </div>

                  {showAdminButtons && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        {/* 멤버관리: OWNER만 */}
                        <button
                            onClick={() => handleMemberClick(team)}
                            style={{
                              ...adminBtnStyle,
                              backgroundColor: team.role === 'OWNER' ? "#e6f7ff" : "#f5f5f5",
                              color: team.role === 'OWNER' ? "#1890ff" : "#bbb",
                              borderColor: team.role === 'OWNER' ? "#91d5ff" : "#e0e0e0",
                            }}
                            title={team.role !== 'OWNER' ? 'OWNER만 멤버 관리 가능' : '멤버 관리'}
                        >
                          멤버 관리
                        </button>

                        {/* 수정: OWNER/EDITOR */}
                        {(team.role === 'OWNER' || team.role === 'EDITOR') ? (
                            <button onClick={() => handleEditClick(team)} style={adminBtnStyle}>수정</button>
                        ) : (
                            <button onClick={() => alert('수정 권한이 없습니다. (OWNER 또는 EDITOR만 가능)')}
                                    style={{ ...adminBtnStyle, color: '#bbb', borderColor: '#e0e0e0' }}>수정</button>
                        )}

                        {/* 삭제: OWNER만 */}
                        {team.role === 'OWNER' && (
                            <button
                                onClick={() => handleDelete(team.team_id)}
                                style={{ ...adminBtnStyle, backgroundColor: "#fff0f0", color: "#ff4d4f", borderColor: "#ffa39e" }}
                            >삭제</button>
                        )}
                      </div>
                  )}
                </div>
            ))
        ) : (
            <p style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>참여 중인 그룹이 없습니다.</p>
        )}
      </div>
  );
}

const listContainerStyle = { padding: "20px", display: "flex", flexDirection: "column", gap: "12px" };
const listItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const infoStyle = { textAlign: "left" };
const nameStyle = { fontSize: "16px", color: "#333" };
const descStyle = { fontSize: "13px", color: "#777", margin: "4px 0 0 0" };
const adminBtnStyle = { padding: "6px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };

export default TeamList;
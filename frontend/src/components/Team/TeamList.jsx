// 그룹 목록 보여주기,관리
import { useState , useEffect } from "react";
import axios from "axios";
import { useNavigate , useLocation } from "react-router-dom";

// 부모(TeamManageModal 등)로부터 reloadKey와 setReloadKey를 받는다고 가정
function TeamList({ showAdminButtons = false, reloadKey, setReloadKey }) {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. reloadKey가 변경될 때마다 목록을 다시 가져옴
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get("/api/myteams");
        setTeams(response.data);
      } catch (err) {
        console.error("그룹 목록 불러오기 실패", err);
      }
    };
    fetchTeams();
  }, [reloadKey]); 

  // 2. 그룹 목록에서 그룹 삭제
  const handleDelete = async (team_id) => {
    if (window.confirm("이 그룹을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) {
      try {
        await axios.delete(`/api/teams/${team_id}`);
        alert("삭제되었습니다.");
        
        if (setReloadKey) {
          setReloadKey(prev => prev + 1);
        }
      } catch (err) {
        console.error("삭제 실패", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div style={listContainerStyle}>
      {teams.length > 0 ? (
        teams.map((team) => (
          <div key={team.team_id} style={{ ...listItemStyle, borderLeft: `6px solid ${team.team_color}` }}>
            <div style={infoStyle}>
              <strong style={nameStyle}>{team.team_name}</strong>
              <p style={descStyle}>{team.description}</p>
            </div>

            {showAdminButtons && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => navigate(`/groups/${team.team_id}/members`, { 
                    state: { teamName: team.team_name, backgroundLocation: location } 
                  })}
                  style={{...adminBtnStyle, backgroundColor: "#e6f7ff",  color: "#1890ff", borderColor: "#91d5ff"}}
                >
                  멤버 관리
                </button>
                <button 
                  onClick={() => navigate('/groups/edit', { 
                    state: { selectedTeam: team, backgroundLocation: location } 
                  })}
                  style={adminBtnStyle}
                >
                  수정
                </button>
                <button 
                  onClick={() => handleDelete(team.team_id)}
                  style={{ ...adminBtnStyle, backgroundColor: "#fff0f0", color: "#ff4d4f", borderColor: "#ffa39e" }}
                >
                  삭제
                </button>
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

// 스타일
const listContainerStyle = { padding: "20px", display: "flex", flexDirection: "column", gap: "12px" };
const listItemStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const infoStyle = { textAlign: "left" };
const nameStyle = { fontSize: "16px", color: "#333" };
const descStyle = { fontSize: "13px", color: "#777", margin: "4px 0 0 0" };
const adminBtnStyle = { padding: "6px 12px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };

export default TeamList;
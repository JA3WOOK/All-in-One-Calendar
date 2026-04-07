// 멤버 관리 모달
import { useState , useEffect , useCallback } from "react";
import axios from "axios";
import { useParams , useLocation , useNavigate } from "react-router-dom";

function MemberManageModal() {
  const { team_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState([]);
  const [sendInvites, setSendInvites] = useState([]); // 변수명 통일
  const [reloadKey, setReloadKey] = useState(0); 
  
  const teamName = location.state?.teamName || "그룹";
  const myId = localStorage.getItem('userId') || 1; // 내 ID , 로그인 정보에서 가져오기

  // 1. 멤버 목록 가져오기
  const fetchMembers = useCallback(async () => {
    if (!team_id) return;
    try {
      const res = await axios.get(`/api/teams/${team_id}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error("멤버 목록 가져오기 실패", err);
    }
  }, [team_id]);

  // 2. 보낸 초대 목록 가져오기
  const fetchGroupInvites = useCallback(async () => {
    if (!team_id || !myId) return;
    try {
      const res = await axios.get(`/api/invitations/sendlist?user_id=${myId}&team_id=${team_id}`);
      setSendInvites(res.data || []);
    } catch (err) {
      console.error("초대 목록 가져오기 실패", err);
    }
  }, [team_id, myId]);

  // 3. 트리거 작동 (의존성 배열에서 함수를 제거)
  useEffect(() => {
    fetchMembers();
    fetchGroupInvites();
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [reloadKey, team_id]); 
// 💡 reloadKey나 team_id가 바뀔 때만 실행함

  const refreshList = () => setReloadKey(prev => prev + 1);

  // 현재 그룹에 멤버 초대 
  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) return alert("올바른 이메일 형식을 입력하세요.");
    try {
      await axios.post('/api/invitations/send', { invitee_email: email, team_id: team_id });
      alert("초대장을 발송했습니다!");
      setEmail(""); 
      refreshList();
    } catch (err) {
      alert(err.response?.data?.message || "초대 실패");
    }
  };

  // 권한 변경
 const handleChangeRole = async (user_id, nextRole) => {
  try {
    await axios.put('/api/members/role', { 
      new_role: nextRole, 
      team_id, 
      user_id 
    });

    alert(`권한이 ${nextRole === 'EDITOR' ? 'EDITOR' : 'VIEWER'}로 변경되었습니다.`);
    if (typeof refreshList === 'function') refreshList();
    
  } catch (err) {
    console.error("권한 변경 실패:", err);
    alert("권한 변경에 실패했습니다.");
  }
};

  // 멤버 삭제
  const handleKick = async (user_id, userName) => {
    if (window.confirm(`${userName}님을 삭제하시겠습니까?`)) {
      try {
        await axios.delete('/api/members/delete', { data: { team_id, user_id } });
        refreshList();
      } catch (err) {
        alert("삭제 실패",err);
      }
    }
  };

  

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>👥 {teamName} 멤버 관리</h2>
          <button onClick={() => navigate(-1)} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={searchSectionStyle}>
          <input type="email" placeholder="이메일 입력" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <button onClick={handleInvite} style={inviteBtnStyle}>초대</button>
        </div>

        <hr style={dividerStyle} />

        <div style={listScrollStyle}>
          <h3 style={sectionTitleStyle}>현재 멤버 ({members.length})</h3>
          {members.map((member) => (
            <div key={member.user_id} style={memberItemStyle}>
              <div style={memberInfoStyle}>
                <strong>{member.name}</strong>
                <span style={emailTextStyle}>{member.email}</span>
              </div>
              <div style={actionGroupStyle}>
                {member.role === 'OWNER' ? (
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#52c41a', padding: '0 10px' }}>
                    OWNER
                    </span>
                    ) : (
                    <select 
                    value={member.role?.toUpperCase() || 'EDITOR'} 
                    onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                    style={selectStyle} 
                    >
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                      </select>
                    )}
                    
                    {/* OWNER가 아닐 때만 삭제 버튼 표시 */}
                    {member.role !== 'OWNER' && (
                      <button onClick={() => handleKick(member.user_id, member.name)} style={kickBtnStyle}>
                        삭제
                      </button>
                    )}
              </div>
            </div>
          ))}

          <h3 style={{ ...sectionTitleStyle, marginTop: '25px' }}>보낸 초대 현황 ({sendInvites.length})</h3>
          {sendInvites.length > 0 ? (
            sendInvites.map((invite) => (
              <div key={invite.invite_id} style={{ ...memberItemStyle, backgroundColor: '#fcfcfc', padding: '10px' }}>
                <div style={memberInfoStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <strong>{invite.invitee_name}</strong>
                    <span style={pendingBadgeStyle}>대기중</span>
                  </div>
                  <span style={emailTextStyle}>초대일: {new Date(invite.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#ccc', fontSize: '13px' }}>대기 중인 초대가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
// 스타일
  const sectionTitleStyle = { fontSize: '15px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#333', textAlign: 'left' };
  const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 };
  const modalStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '480px', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' };
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
  const closeBtnStyle = { border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#ccc' };
  const searchSectionStyle = { display: 'flex', gap: '8px', marginBottom: '10px' };
  const inputStyle = { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' };
  const inviteBtnStyle = { padding: '10px 24px', backgroundColor: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
  const dividerStyle = { border: 'none', borderTop: '1px solid #f0f0f0', margin: '20px 0' };
  const listScrollStyle = { maxHeight: '350px', overflowY: 'auto' };
  const memberItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #fbfbfb' };
  const memberInfoStyle = { display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '2px' };
  const emailTextStyle = { fontSize: '13px', color: '#999' };
  const pendingBadgeStyle = { fontSize: '11px', color: '#faad14', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '2px 6px', borderRadius: '4px' };
  const actionGroupStyle = { display: 'flex', gap: '8px' };
  const kickBtnStyle = { padding: '5px 10px', fontSize: '12px', backgroundColor: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', cursor: 'pointer' };
  const selectStyle = { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', backgroundColor: '#fff', cursor: 'pointer', outline: 'none',marginRight: '5px'};

export default MemberManageModal;
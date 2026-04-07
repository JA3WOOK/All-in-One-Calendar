// 내가 받은 초대 목록 , 관리
import { useState , useEffect } from "react";
import API from '../../api/axios';

function ReceivedInvites({ onRefresh }) {

  const [invites, setInvites] = useState([]);

  // 내가 받은 초대 목록 보여주기
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await API.get('/api/invitations/receivelist');
        setInvites(res.data || []);
      } catch (err) {
        console.error("초대 목록 로드 실패", err);
      }
    };
    fetchInvites();
  }, [onRefresh]);

  // 받은 초대 관리
  const handleAction = async (inviteId, status) => {
    try {
      await API.put("/api/invitations/response", {
        status : status,
        invite_id : inviteId
      });
      alert(status === 'ACCEPTED' ? "그룹에 합류했습니다!" : "초대를 거절했습니다.");
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("처리 중 오류가 발생했습니다.",err);
    }
  };

  if (invites.length === 0) return <p style={{ fontSize: '13px', color: '#ccc', textAlign: 'center' }}>도착한 초대가 없습니다.</p>;

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {invites.map((invite) => (
            <div key={invite.invite_id} style={cardStyle}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{invite.team_name}</span>
                <div style={{ fontSize: '12px', color: '#888' }}>보낸 사람: {invite.inviter_name}</div>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => handleAction(invite.invite_id, 'ACCEPTED')} style={acceptBtnStyle}>수락</button>
                <button onClick={() => handleAction(invite.invite_id, 'REJECTED')} style={rejectBtnStyle}>거절</button>
              </div>
            </div>
        ))}
      </div>
  );
}

const cardStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ddd' };
const acceptBtnStyle = { padding: '4px 10px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', color: '#1890ff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };
const rejectBtnStyle = { padding: '4px 10px', backgroundColor: '#fff', border: '1px solid #ddd', color: '#999', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

export default ReceivedInvites;
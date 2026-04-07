import { useState } from "react";
import TeamList from "./TeamList";
import ReceivedInvites from "./ReceivedInvites"; 

function TeamManageModal({ onClose }) {
  const [reloadKey, setReloadKey] = useState(0);

  // 리스트 갱신용 함수
  const handleRefresh = () => setReloadKey(prev => prev + 1);

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={contentStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>그룹 관리</h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>
        
        <hr style={{ margin: '15px 0' }} />

        {/* 1. 내가 받은 초대장   */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>📩 나를 초대한 그룹</h3>
          <ReceivedInvites onRefresh={handleRefresh} />
        </div>

        <div style={{ margin: '30px 0' }}></div>

        {/* 2. 참여 중인 그룹 목록  */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>👥 참여 중인 그룹</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <TeamList 
              showAdminButtons={true} 
              reloadKey={reloadKey} 
              setReloadKey={setReloadKey} 
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={onClose} style={doneBtnStyle}>닫기</button>
        </div>
      </div>
    </div>
  );
}

// 스타일
const sectionStyle = { textAlign: 'left' };
const sectionTitleStyle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#555' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const contentStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', width: '550px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnStyle = { border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' };
const doneBtnStyle = { padding: '10px 25px', backgroundColor: '#b5b7ba', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default TeamManageModal;
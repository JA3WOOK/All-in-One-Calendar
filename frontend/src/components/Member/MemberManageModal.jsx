// 멤버 관리 모달
import { useState , useEffect , useCallback } from "react";
import API from '../../api/axios';
import { useParams , useLocation , useNavigate } from "react-router-dom";

function MemberManageModal(props = {}) {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    // props로 받은 teamId 우선, 없으면 URL params
    const team_id = props.teamId ?? params.team_id;

    const [email, setEmail] = useState("");
    // 초대장 발송시 이메일 자동완성
    const [searchResults, setSearchResults] = useState([]); // 검색된 유저 목록
    const [showAuto, setShowAuto] = useState(false);       // 자동완성창 표시 여부
    const [myRole, setMyRole] = useState('VIEWER');
    const [members, setMembers] = useState([]);
    const [sendInvites, setSendInvites] = useState([]); // 변수명 통일
    const [reloadKey, setReloadKey] = useState(0);

    const teamName = props.teamName || location.state?.teamName || "그룹";
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = user.user_id || 1;

    // 1. 멤버 목록 가져오기
    const fetchMembers = useCallback(async () => {
        if (!team_id) return;
        try {
            const res = await API.get(`/api/teams/${team_id}/members`);
            const list = res.data || [];
            setMembers(list);
            const me = list.find(m => m.user_id === myId);
            setMyRole(me?.role);
        } catch (err) {
            console.error("멤버 목록 가져오기 실패", err);
        }
    }, [team_id]);

    // 2. 보낸 초대 목록 가져오기
    const fetchGroupInvites = useCallback(async () => {
        if (!team_id || !myId) return;
        try {
            const res = await API.get(`/api/invitations/sendlist?team_id=${team_id}`);
            setSendInvites(res.data || []);
        } catch (err) {
            console.error("초대 목록 가져오기 실패", err);
        }
    }, [team_id, myId]);

    // 초대 취소 핸들러
    const handleCancelInvite = async (inviteId) => {
        if (window.confirm("초대장 발송을 취소하시겠습니까?")) {
            try {
                await API.delete('/api/invitations/cancel', { data: { invite_id: inviteId } });
                alert("초대가 취소되었습니다.");
                refreshList();
            } catch (err) {
                const errorMsg = err.response?.data?.error || "초대 취소에 실패했습니다.";
                alert(errorMsg);
            }
        }
    };

    // 3. 트리거 작동 (의존성 배열에서 함수를 제거)
    useEffect(() => {
        fetchMembers();
        fetchGroupInvites();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey, team_id]);
    // 💡 reloadKey나 team_id가 바뀔 때만 실행함

    const refreshList = () => setReloadKey(prev => prev + 1);

    // 초대장 발송시 이메일 자동 완성
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (email.trim().length >= 2) {
                try {
                    const res = await API.get(`/api/invitations/search-users?term=${email}`);
                    setSearchResults(res.data);
                    setShowAuto(true);
                } catch (err) {
                    console.error("유저 검색 실패", err);
                }
            } else {
                setSearchResults([]);
                setShowAuto(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [email]);

    const handleSelectUser = (selectedEmail) => {
        setEmail(selectedEmail);
        setSearchResults([]);
        setShowAuto(false);
    };

    // 현재 그룹에 멤버 초대
    const handleInvite = async () => {
        if (!email.trim() || !email.includes('@')) return alert("올바른 이메일 형식을 입력하세요.");
        try {
            await API.post('/api/invitations/send', { invitee_email: email, team_id });
            alert("초대장을 발송했습니다!");
            setEmail("");
            refreshList();
        } catch (err) {
            const serverMessage = err.response?.data?.errors?.[0] || "초대 실패";
            alert(serverMessage);
        }
    };

    // 권한 변경
    const handleChangeRole = async (user_id, nextRole) => {
        try {
            await API.put('/api/members/role', {
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
                await API.delete('/api/members/delete', { data: { team_id, user_id } });
                refreshList();
            } catch (err) {
                alert("삭제 실패",err);
            }
        }
    };


    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* 헤더 영역 - 공통 */}
                <div style={headerStyle}>
                    <h2 style={{ margin: 0 }}>👥 {teamName} 멤버</h2>
                    <button onClick={() => props.onClose ? props.onClose() : navigate(-1)} style={closeBtnStyle}>&times;</button>
                </div>

                {/* 1. 초대 섹션 - OWNER만 보임 */}
                {myRole === 'OWNER' && (
                    <div style={{ position: 'relative', marginBottom: '20px' }}> 
                        <div style={searchSectionStyle}>
                            <input 
                                type="email" 
                                placeholder="이메일 입력" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                style={inputStyle} 
                            />
                            <button onClick={handleInvite} style={inviteBtnStyle}>초대</button>
                        </div>
                        
                        {showAuto && searchResults.length > 0 && (
                            <div style={autoCompleteContainer}>
                                {searchResults.map((user) => (
                                    <div 
                                        key={user.user_id} 
                                        onClick={() => handleSelectUser(user.email)}
                                        style={autoItemStyle}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{user.name}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{user.email}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div> 
                )}

                <hr style={dividerStyle} />

                {/* 2. 멤버 목록 & 초대 현황 */}
                <div style={listScrollStyle}>
                    <h3 style={sectionTitleStyle}>현재 멤버 ({members.length})</h3>
                    {members.map((member) => (
                        <div key={member.user_id} style={memberItemStyle}>
                            <div style={memberInfoStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* 프로필 이미지 */}
                                    {member.profile_image ? (
                                        <img
                                        src={"http://localhost:3001" + member.profile_image}
                                        alt={member.name}
                                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                                        />
                                    ) : (
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        backgroundColor: '#e6f7ff', color: '#1890ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 'bold', flexShrink: 0,
                                        border: '1px solid #91d5ff'
                                        }}>
                                            {member.name?.charAt(0)}
                                            </div>
                                        )}
                                        {/* 이름 , 이메일 */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {/* 목록에서 '나'임을 표시하는 뱃지 */}
                                                {member.user_id === myId && <span style={meBadgeStyle}>나</span>} 
                                                <strong>{member.name}</strong>
                                            </div>
                                            <span style={emailTextStyle}>{member.email}</span>
                                        </div>
                                    </div>
                                </div>
                            
                            <div style={actionGroupStyle}>
                                {member.role === 'OWNER' ? (
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#52c41a', padding: '0 10px' }}>
                                        OWNER
                                    </span>
                                ) : myRole === 'OWNER' ? (
                                    /* 내가 OWNER라면 다른 사람의 권한을 변경하거나 삭제 가능 */
                                    <>
                                        <select
                                            value={member.role?.toUpperCase() || 'EDITOR'}
                                            onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="EDITOR">EDITOR</option>
                                            <option value="VIEWER">VIEWER</option>
                                        </select>
                                        <button onClick={() => handleKick(member.user_id, member.name)} style={kickBtnStyle}>
                                            삭제
                                        </button>
                                    </>
                                ) : (
                                    /* 내가 OWNER가 아니라면 그냥 역할 이름만 텍스트로 표시 */
                                    <span style={{ fontSize:'12px', color:'#9ca3af', padding:'0 6px' }}>{member.role}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 보낸 초대 현황 - 초대는 'OWNER'만 가능,초대 상황은 멤버에게 다 보임 */}
                        <>
                            <h3 style={{ ...sectionTitleStyle, marginTop: '25px' }}> 초대 현황 ({sendInvites.length})</h3>
                            {sendInvites.length > 0 ? (
                                sendInvites.map((invite) => (
                                    <div key={invite.invite_id} style={{ ...memberItemStyle, backgroundColor: '#fcfcfc', padding: '10px' }}>
                                        <div style={memberInfoStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <strong>{invite.invitee_name}</strong>
                                                {invite.status === 'PENDING' && (
                                                    <span style={pendingBadgeStyle}>대기중</span>
                                                )}
                                            </div>
                                            <span style={emailTextStyle}>초대일: {new Date(invite.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {myRole === 'OWNER'&& (
                                            <div style={actionGroupStyle}>
                                            {invite.status === 'PENDING' && (
                                                <button onClick={() => handleCancelInvite(invite.invite_id)} style={cancelBtnStyle}>
                                                    취소
                                                </button>
                                            )}
                                        </div>                                    
                                        )}                                        
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: '#ccc', fontSize: '13px' }}>초대 내역이 없습니다.</p>
                            )}
                        </>
                 
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
const cancelBtnStyle = { padding: '5px 10px', fontSize: '12px', backgroundColor: '#f5f5f5', color: '#666', border: '1px solid #d9d9d9', borderRadius: '6px', cursor: 'pointer'};
const actionGroupStyle = { display: 'flex', gap: '8px' };
const kickBtnStyle = { padding: '5px 10px', fontSize: '12px', backgroundColor: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', cursor: 'pointer' };
const selectStyle = { padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px', backgroundColor: '#fff', cursor: 'pointer', outline: 'none',marginRight: '5px'};
const autoCompleteContainer = {position: 'absolute',top: '50px', left: 0,right: '85px',backgroundColor: '#fff',borderRadius: '8px',boxShadow: '0 8px 20px rgba(0,0,0,0.15)',zIndex: 100,maxHeight: '200px',overflowY: 'auto',border: '1px solid #eee'};
const autoItemStyle = {padding: '10px 15px',cursor: 'pointer',textAlign: 'left',borderBottom: '1px solid #fafafa',display: 'flex',flexDirection: 'column',gap: '2px',transition: 'background-color 0.2s'};
const meBadgeStyle = { fontSize: 10, color: '#1890ff', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', padding: '1px 6px', borderRadius: '60%', fontWeight: 600 };


export default MemberManageModal;
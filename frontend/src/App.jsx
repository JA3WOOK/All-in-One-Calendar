import { Routes, Route, useLocation, useNavigate } from 'react-router-dom' // 모달라우팅 
import './App.css'
import TeamModal from './components/Team/TeamModal' // 그룹 생성 모달
import TeamManageModal from "./components/Team/TeamManageModal"; // 그룹 관리 모달
import MemberManageModal from "./components/Member/MemberManageModal"; // 그룹 멤버 관리 모달

function App() {
  const location = useLocation()
  const navigate = useNavigate();
  const background = location.state && location.state.backgroundLocation; // 배경 유지하며 모달 올라옴

  return (
    <div className="App">
      <Routes location={background || location}>
        <Route path="/" element={
          <div style={{ textAlign: 'center', padding: '50px' }}>                        
      </div>

        } />
        
      </Routes>

      {/* --- 2층: 모달 레이어 --- */}
      {background && (
        <Routes>
          {/* 그룹 생성 모달 ,onClose={() => navigate(-1) 닫기 누르면 이전으로*/}
          <Route path="/groups/create" element={<TeamModal onClose={() => navigate(-1)}/>} /> 

           {/* 그룹 수정 모달 */}
          <Route path="/groups/edit" element={<TeamModal onClose={() => navigate(-1)} />} />

           {/* 그룹 관리 모달*/}
           <Route path="/admin/groups" element={<TeamManageModal onClose={() => navigate(-1)} />} />

            {/* 그룹 멤버 관리 모달*/}
            <Route path="/groups/:team_id/members" element={<MemberManageModal />} />
        </Routes>
      )}
    </div>
  )
}

export default App

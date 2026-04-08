import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import SignupPage from './pages/auth/SignupPage.jsx'
import MyPage from './pages/user/MyPage.jsx'
import EditProfilePage from './pages/user/EditProfilePage.jsx'
import ChangePasswordPage from './pages/user/ChangePasswordPage.jsx'
import ForgotPasswordPage from './pages/user/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/user/ResetPasswordPage.jsx'
import MemberManageModal from './components/Member/MemberManageModal.jsx'

// 로그인 여부 확인
function PrivateRoute({ children }) {
    const token = localStorage.getItem('accessToken');
    return token ? children : <Navigate to="/login" replace />;
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                {/* 초기 진입: 로그인 페이지로 리다이렉트 */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* 인증 */}
                <Route path="/login"  element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />

                {/* 메인 캘린더 (로그인 필요) */}
                <Route path="/calendar" element={
                    <PrivateRoute><App /></PrivateRoute>
                } />

                {/* 마이페이지 (로그인 필요) */}
                <Route path="/mypage" element={
                    <PrivateRoute><MyPage /></PrivateRoute>
                } />
                <Route path="/edit-profile" element={
                    <PrivateRoute><EditProfilePage /></PrivateRoute>
                } />
                <Route path="/change-password" element={
                    <PrivateRoute><ChangePasswordPage /></PrivateRoute>
                } />

                {/* 그룹 멤버 관리 */}
                <Route path="/groups/:team_id/members" element={
                    <PrivateRoute><MemberManageModal /></PrivateRoute>
                } />

                {/* 없는 경로 → 로그인 */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
)
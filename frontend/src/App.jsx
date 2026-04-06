import { Routes, Route } from "react-router-dom";

import MyPage from "./pages/user/MyPage";
import EditProfilePage from "./pages/user/EditProfilePage";
import ChangePasswordPage from "./pages/user/ChangePasswordPage";
import ForgotPasswordPage from "./pages/user/ForgotPasswordPage";
import ResetPasswordPage from "./pages/user/ResetPasswordPage";

function App() {
  return (
    <Routes>
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/edit-profile" element={<EditProfilePage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

export default App;
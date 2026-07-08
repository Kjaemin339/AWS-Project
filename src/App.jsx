import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import RequireAuth from './components/RequireAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProfileInput from './pages/ProfileInput';
import Results from './pages/Results';
import ProgramDetail from './pages/ProgramDetail';
import Dashboard from './pages/Dashboard';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div style={{ position: 'relative', minHeight: '100vh', background: '#FAFAFA' }}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/profile" element={<RequireAuth><ProfileInput /></RequireAuth>} />
              <Route path="/results" element={<RequireAuth><Results /></RequireAuth>} />
              <Route path="/programs/:id" element={<RequireAuth><ProgramDetail /></RequireAuth>} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/mypage" element={<RequireAuth><MyPage /></RequireAuth>} />
            </Routes>
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

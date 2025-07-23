import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VacationProvider } from './contexts/VacationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import DepartmentLogin from './components/Auth/DepartmentLogin';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import Dashboard from './components/Dashboard/Dashboard';
import VacationDebugger from './components/Debug/VacationDebugger';
import NotificationContainer from './components/Common/NotificationContainer';
import './App.css';

// 보호된 라우트 컴포넌트
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" />;
}

function App() {
  const { isLoggedIn } = useAuth();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  // 관리자 로그인 처리
  const handleAdminLogin = () => {
    setIsAdminMode(true);
    setShowAdminLogin(false);
  };

  // 관리자 로그아웃 처리
  const handleAdminLogout = () => {
    setIsAdminMode(false);
    setShowAdminLogin(false);
  };

  // 일반 로그인으로 돌아가기
  const handleBackToLogin = () => {
    setShowAdminLogin(false);
  };

  // 관리자 로그인 표시
  const handleShowAdminLogin = () => {
    setShowAdminLogin(true);
  };

  // 관리자 모드인 경우 관리자 대시보드 표시
  if (isAdminMode) {
    return (
      <NotificationProvider>
        <AdminDashboard onLogout={handleAdminLogout} />
        <NotificationContainer />
      </NotificationProvider>
    );
  }

  // 관리자 로그인 페이지 표시
  if (showAdminLogin) {
    return (
      <NotificationProvider>
        <AdminLogin 
          onAdminLogin={handleAdminLogin}
          onBackToLogin={handleBackToLogin}
        />
        <NotificationContainer />
      </NotificationProvider>
    );
  }

  // 로그인하지 않은 경우 부서 로그인 페이지 표시
  if (!isLoggedIn) {
    return (
      <NotificationProvider>
        <DepartmentLogin onShowAdminLogin={handleShowAdminLogin} />
        <NotificationContainer />
      </NotificationProvider>
    );
  }

  // 일반 부서 사용자 대시보드
  return (
    <NotificationProvider>
      <VacationProvider>
        <Routes>
          <Route path="/login" element={<DepartmentLogin onShowAdminLogin={handleShowAdminLogin} />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
                {process.env.NODE_ENV === 'development' && <VacationDebugger />}
              </ProtectedRoute>
            }
          />
          {/* 기본 경로를 메인 대시보드로 리다이렉트 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NotificationContainer />
      </VacationProvider>
    </NotificationProvider>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
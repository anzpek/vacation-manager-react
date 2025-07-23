// AdminLogin.jsx - 관리자 로그인 컴포넌트
import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import './AdminLogin.css';

const AdminLogin = ({ onAdminLogin, onBackToLogin }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showError } = useNotification();
  const { theme, toggleTheme } = useTheme();

  // 관리자 비밀번호 (실제 운영시에는 환경변수나 Firebase에서 관리)
  const ADMIN_PASSWORD = 'admin2024!';

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!adminPassword.trim()) {
      showError('입력 오류', '관리자 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      if (adminPassword === ADMIN_PASSWORD) {
        onAdminLogin();
      } else {
        showError('로그인 실패', '관리자 비밀번호가 틀렸습니다.', 5000);
      }
    } catch (error) {
      showError('로그인 오류', '관리자 로그인 중 오류가 발생했습니다.', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-header">
          <div className="admin-header-top">
            <button 
              className="admin-theme-button"
              onClick={toggleTheme}
              title={`현재: ${theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '시스템 설정'}`}
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
            </button>
          </div>
          <div className="admin-logo">
            <span className="admin-icon">🔐</span>
            <h1 className="admin-title">시스템 관리자</h1>
          </div>
          <p className="admin-subtitle">관리자 권한으로 로그인하세요</p>
        </div>

        <form className="admin-form" onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label htmlFor="adminPassword">관리자 비밀번호</label>
            <input
              type="password"
              id="adminPassword"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="관리자 비밀번호를 입력하세요"
              className="admin-input"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={isLoading || !adminPassword}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⏳</span>
                로그인 중...
              </>
            ) : (
              <>
                <span className="login-icon">🔑</span>
                관리자 로그인
              </>
            )}
          </button>
        </form>

        <div className="admin-back">
          <button 
            className="back-button"
            onClick={onBackToLogin}
            type="button"
          >
            ← 일반 로그인으로 돌아가기
          </button>
        </div>

        <div className="admin-notice">
          <div className="notice-title">⚠️ 관리자 전용</div>
          <div className="notice-text">
            이 페이지는 시스템 관리자만 접근할 수 있습니다.<br />
            부서/팀 생성 및 전체 시스템 관리 권한이 제공됩니다.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
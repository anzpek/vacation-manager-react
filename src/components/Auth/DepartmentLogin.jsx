// DepartmentLogin.jsx - 부서별 로그인 컴포넌트
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './DepartmentLogin.css';

const DepartmentLogin = ({ onShowAdminLogin }) => {
  const { departments, loginWithDepartment } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [departmentName, setDepartmentName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    
    if (!departmentName.trim() || !password) {
      setError('부서명과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 부서명으로 부서 찾기 (대소문자 구분 없이)
      const department = departments.find(dept => 
        dept.name.toLowerCase() === departmentName.trim().toLowerCase()
      );
      
      if (!department) {
        setError('존재하지 않는 부서명입니다.');
        setIsLoading(false);
        return;
      }
      
      await loginWithDepartment(department.code, password);
      // 로그인 성공 시 App.jsx에서 자동으로 메인 화면으로 이동
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [departmentName, password, loginWithDepartment, departments]);

  return (
    <div className="login-container">
      <div className="login-card" id="main-content" tabIndex="-1">
        <div className="login-header">
          <div className="header-top">
            <div className="theme-toggle login-theme-toggle">
              <button 
                className="theme-button login-theme-button"
                onClick={toggleTheme}
                title={`현재: ${theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '시스템 설정'}`}
                aria-label="테마 변경"
              >
                <span className="theme-icon">{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</span>
              </button>
            </div>
          </div>
          <div className="company-logo">
            <h1 className="company-title">휴가 관리 시스템</h1>
          </div>
          <p className="login-subtitle">부서명과 비밀번호를 입력하여 로그인하세요</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {/* 부서명 입력 */}
          <div className="form-group">
            <label htmlFor="departmentName">부서명</label>
            <input
              type="text"
              id="departmentName"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="부서명을 입력하세요"
              className="form-input"
              autoComplete="organization"
              list="department-suggestions"
            />
            <datalist id="department-suggestions">
              {departments.map((dept) => (
                <option key={dept.code} value={dept.name} />
              ))}
            </datalist>
            {departments.length > 0 && (
              <div className="department-suggestions">
                <small>사용 가능한 부서: {departments.slice(0, 3).map(d => d.name).join(', ')}{departments.length > 3 ? ` 외 ${departments.length - 3}개` : ''}</small>
              </div>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="부서 비밀번호를 입력하세요"
              className="form-input"
              autoComplete="current-password"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !departmentName.trim() || !password}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                로그인 중...
              </>
            ) : (
              departmentName.trim() ? `${departmentName.trim()} 로그인` : '로그인'
            )}
          </button>
        </form>

        {/* 도움말 */}
        <div className="login-help">
          <div className="help-title">로그인 안내</div>
          <div className="help-text">
            정확한 부서명과 부서별 전용 비밀번호를 입력하세요.<br />
            부서명이나 비밀번호가 기억나지 않으시면 부서 관리자에게 문의하시기 바랍니다.
          </div>
        </div>

        {/* 관리자 섹션 */}
        {onShowAdminLogin && (
          <div className="admin-section">
            <button 
              className="admin-button"
              onClick={onShowAdminLogin}
              type="button"
            >
              시스템 관리자 로그인
            </button>
          </div>
        )}

        </div>
    </div>
  );
};

export default DepartmentLogin;
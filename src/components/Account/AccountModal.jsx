// AccountModal.jsx - 계정 관리 모달
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AccountModal.css';

const AccountModal = ({ isOpen, onClose }) => {
  const { currentDepartment, logout, updateDepartmentPassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage('');

    // 비밀번호 유효성 검사
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('새 비밀번호가 일치하지 않습니다.');
      setIsChangingPassword(false);
      return;
    }

    if (passwordData.newPassword.length < 4) {
      setPasswordMessage('비밀번호는 최소 4자 이상이어야 합니다.');
      setIsChangingPassword(false);
      return;
    }

    try {
      // 현재 비밀번호 확인 (간단한 로컬 확인)
      const storedPassword = localStorage.getItem(`dept_${currentDepartment?.code}_password`);
      if (storedPassword && storedPassword !== passwordData.currentPassword) {
        setPasswordMessage('현재 비밀번호가 올바르지 않습니다.');
        setIsChangingPassword(false);
        return;
      }

      // 새 비밀번호 저장 (Firebase와 동기화)
      try {
        await updateDepartmentPassword(currentDepartment?.code, passwordData.newPassword);
        setPasswordMessage('비밀번호가 성공적으로 변경되었습니다.');
      } catch (error) {
        setPasswordMessage('비밀번호 변경 중 오류가 발생했습니다.');
        console.error('비밀번호 변경 실패:', error);
      }
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => {
        setPasswordMessage('');
      }, 3000);
    } catch (error) {
      setPasswordMessage('비밀번호 변경 중 오류가 발생했습니다.');
    }

    setIsChangingPassword(false);
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-modal-header">
          <h2>계정 관리</h2>
          <button className="account-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="account-modal-tabs">
          <button 
            className={`account-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            계정 정보
          </button>
          <button 
            className={`account-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            비밀번호 변경
          </button>
        </div>

        <div className="account-modal-content">
          {activeTab === 'info' && (
            <div className="account-info-tab">
              <div className="account-info-section">
                <h3>부서 정보</h3>
                <div className="account-info-item">
                  <label>부서명</label>
                  <div className="account-info-value">{currentDepartment?.name || '알 수 없음'}</div>
                </div>
                <div className="account-info-item">
                  <label>부서 코드</label>
                  <div className="account-info-value">{currentDepartment?.code || '알 수 없음'}</div>
                </div>
                <div className="account-info-item">
                  <label>로그인 시간</label>
                  <div className="account-info-value">
                    {new Date().toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div className="account-info-section">
                <h3>시스템 정보</h3>
                <div className="account-info-item">
                  <label>앱 버전</label>
                  <div className="account-info-value">v1.0.0</div>
                </div>
                <div className="account-info-item">
                  <label>최근 업데이트</label>
                  <div className="account-info-value">2025년 7월</div>
                </div>
              </div>

              <div className="account-actions">
                <button className="account-logout-btn" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="account-password-tab">
              <form onSubmit={handlePasswordChange}>
                <div className="password-form-group">
                  <label htmlFor="currentPassword">현재 비밀번호</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>

                <div className="password-form-group">
                  <label htmlFor="newPassword">새 비밀번호</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                    placeholder="새 비밀번호를 입력하세요 (최소 4자)"
                    minLength="4"
                  />
                </div>

                <div className="password-form-group">
                  <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                    placeholder="새 비밀번호를 다시 입력하세요"
                    minLength="4"
                  />
                </div>

                {passwordMessage && (
                  <div className={`password-message ${passwordMessage.includes('성공') ? 'success' : 'error'}`}>
                    {passwordMessage}
                  </div>
                )}

                <div className="password-form-actions">
                  <button 
                    type="submit" 
                    className="password-change-btn"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </div>
              </form>

              <div className="password-tips">
                <h4>비밀번호 안전 수칙</h4>
                <ul>
                  <li>최소 4자 이상의 비밀번호를 사용하세요</li>
                  <li>다른 사람과 비밀번호를 공유하지 마세요</li>
                  <li>정기적으로 비밀번호를 변경하세요</li>
                  <li>추측하기 어려운 비밀번호를 사용하세요</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
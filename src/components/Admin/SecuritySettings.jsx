// SecuritySettings.jsx - 보안 설정 모달
import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import './SecuritySettings.css';

const SecuritySettings = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireSpecialChars: true,
    enableTwoFactor: false,
    loginNotifications: true,
    auditLog: true
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (currentPassword !== 'admin2024!') {
      showError('인증 실패', '현재 비밀번호가 틀렸습니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('입력 오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < securitySettings.passwordMinLength) {
      showError('보안 오류', `비밀번호는 최소 ${securitySettings.passwordMinLength}자 이상이어야 합니다.`);
      return;
    }

    setIsLoading(true);

    try {
      // 실제로는 서버에 비밀번호 변경 요청
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showSuccess('비밀번호 변경', '관리자 비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showError('변경 실패', '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    showSuccess('설정 저장', `${getSettingLabel(setting)} 설정이 저장되었습니다.`);
  };

  const getSettingLabel = (setting) => {
    const labels = {
      sessionTimeout: '세션 타임아웃',
      maxLoginAttempts: '최대 로그인 시도',
      passwordMinLength: '최소 비밀번호 길이',
      requireSpecialChars: '특수문자 필수',
      enableTwoFactor: '2단계 인증',
      loginNotifications: '로그인 알림',
      auditLog: '감사 로그'
    };
    return labels[setting] || setting;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="security-settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🔒 보안 설정</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 관리자 비밀번호 변경 */}
          <div className="security-section">
            <h3 className="section-title">관리자 비밀번호 변경</h3>
            <form className="password-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">현재 비밀번호</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 관리자 비밀번호"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 관리자 비밀번호"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                className="change-password-button"
                disabled={isLoading}
              >
                {isLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          </div>

          {/* 보안 정책 설정 */}
          <div className="security-section">
            <h3 className="section-title">보안 정책</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">세션 타임아웃 (분)</div>
                  <div className="setting-description">
                    사용자 세션이 자동으로 만료되는 시간입니다.
                  </div>
                </div>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className="setting-select"
                >
                  <option value={30}>30분</option>
                  <option value={60}>1시간</option>
                  <option value={120}>2시간</option>
                  <option value={240}>4시간</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">최대 로그인 시도 횟수</div>
                  <div className="setting-description">
                    로그인 실패 시 계정 잠금까지의 시도 횟수입니다.
                  </div>
                </div>
                <select
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                  className="setting-select"
                >
                  <option value={3}>3회</option>
                  <option value={5}>5회</option>
                  <option value={10}>10회</option>
                  <option value={0}>무제한</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">최소 비밀번호 길이</div>
                  <div className="setting-description">
                    부서 비밀번호의 최소 글자 수입니다.
                  </div>
                </div>
                <select
                  value={securitySettings.passwordMinLength}
                  onChange={(e) => handleSettingChange('passwordMinLength', parseInt(e.target.value))}
                  className="setting-select"
                >
                  <option value={6}>6자</option>
                  <option value={8}>8자</option>
                  <option value={10}>10자</option>
                  <option value={12}>12자</option>
                </select>
              </div>
            </div>
          </div>

          {/* 고급 보안 설정 */}
          <div className="security-section">
            <h3 className="section-title">고급 보안 설정</h3>
            <div className="toggle-settings">
              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">특수문자 필수</div>
                  <div className="toggle-description">
                    비밀번호에 특수문자 포함을 필수로 합니다.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.requireSpecialChars}
                    onChange={(e) => handleSettingChange('requireSpecialChars', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">2단계 인증</div>
                  <div className="toggle-description">
                    추가 보안을 위한 2단계 인증을 활성화합니다.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.enableTwoFactor}
                    onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">로그인 알림</div>
                  <div className="toggle-description">
                    새로운 로그인 시 관리자에게 알림을 보냅니다.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.loginNotifications}
                    onChange={(e) => handleSettingChange('loginNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <div className="toggle-label">감사 로그</div>
                  <div className="toggle-description">
                    시스템 접근 및 변경 사항을 로그로 기록합니다.
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.auditLog}
                    onChange={(e) => handleSettingChange('auditLog', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
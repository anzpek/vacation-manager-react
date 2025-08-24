// AdminDashboard.jsx - 관리자 대시보드
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import DepartmentManager from './DepartmentManager';
import SystemStatus from './SystemStatus';
import SecuritySettings from './SecuritySettings';
import BackupManager from './BackupManager';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const { departments } = useAuth();
  const { showSuccess } = useNotification();
  const [showDepartmentManager, setShowDepartmentManager] = useState(false);
  const [showSystemStatus, setShowSystemStatus] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showBackupManager, setShowBackupManager] = useState(false);

  const handleLogout = () => {
    showSuccess('로그아웃', '관리자 세션이 종료되었습니다.');
    onLogout();
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="header-content">
          <div className="admin-info">
            <h1 className="dashboard-title">🔐 시스템 관리자</h1>
            <p className="dashboard-subtitle">부서/팀 생성 및 전체 시스템 관리</p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="dashboard-grid">
          {/* 부서 관리 카드 */}
          <div className="admin-card">
            <div className="card-header">
              <h3 className="card-title">🏢 부서/팀 관리</h3>
              <div className="card-badge">{departments.length}개</div>
            </div>
            <div className="card-content">
              <p className="card-description">
                새로운 부서나 팀을 생성하고<br />
                기존 부서의 정보를 관리합니다.
              </p>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">활성 부서</span>
                  <span className="stat-value">{departments.length}</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="action-button primary"
                onClick={() => setShowDepartmentManager(true)}
              >
                부서 관리
              </button>
            </div>
          </div>

          {/* 시스템 상태 카드 */}
          <div className="admin-card">
            <div className="card-header">
              <h3 className="card-title">📊 시스템 현황</h3>
              <div className="card-badge status-active">정상</div>
            </div>
            <div className="card-content">
              <p className="card-description">
                전체 시스템의 상태와<br />
                주요 지표를 확인합니다.
              </p>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">Firebase</span>
                  <span className="stat-value connected">연결됨</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="action-button secondary"
                onClick={() => setShowSystemStatus(true)}
              >
                시스템 상태
              </button>
            </div>
          </div>

          {/* 보안 설정 카드 */}
          <div className="admin-card">
            <div className="card-header">
              <h3 className="card-title">🔒 보안 설정</h3>
              <div className="card-badge secure">보안</div>
            </div>
            <div className="card-content">
              <p className="card-description">
                관리자 비밀번호 변경 및<br />
                보안 정책을 설정합니다.
              </p>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">보안 수준</span>
                  <span className="stat-value secure">높음</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="action-button warning"
                onClick={() => setShowSecuritySettings(true)}
              >
                보안 설정
              </button>
            </div>
          </div>

          {/* 백업 및 복원 카드 */}
          <div className="admin-card">
            <div className="card-header">
              <h3 className="card-title">💾 데이터 관리</h3>
              <div className="card-badge">백업</div>
            </div>
            <div className="card-content">
              <p className="card-description">
                전체 시스템 데이터의<br />
                백업 및 복원을 관리합니다.
              </p>
              <div className="card-stats">
                <div className="stat-item">
                  <span className="stat-label">마지막 백업</span>
                  <span className="stat-value">1시간 전</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                className="action-button secondary"
                onClick={() => setShowBackupManager(true)}
              >
                백업 관리
              </button>
            </div>
          </div>
        </div>

        {/* 부서 목록 미리보기 */}
        <div className="department-preview">
          <h3 className="preview-title">등록된 부서/팀</h3>
          <div className="department-grid">
            {departments.map((dept) => (
              <div key={dept.code} className="department-preview-card">
                <div className="dept-info">
                  <div 
                    className="dept-color" 
                    style={{ backgroundColor: dept.color }}
                  ></div>
                  <div className="dept-details">
                    <div className="dept-name">{dept.name}</div>
                    <div className="dept-code">ID: {dept.code}</div>
                  </div>
                </div>
                <div className="dept-status">
                  <span className="status-badge active">활성</span>
                </div>
              </div>
            ))}
            
            {departments.length === 0 && (
              <div className="no-departments">
                <div className="no-dept-icon">🏢</div>
                <div className="no-dept-text">등록된 부서가 없습니다</div>
                <button 
                  className="create-first-dept"
                  onClick={() => setShowDepartmentManager(true)}
                >
                  첫 번째 부서 생성하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <DepartmentManager 
        isOpen={showDepartmentManager}
        onClose={() => setShowDepartmentManager(false)}
      />
      
      <SystemStatus 
        isOpen={showSystemStatus}
        onClose={() => setShowSystemStatus(false)}
      />
      
      <SecuritySettings 
        isOpen={showSecuritySettings}
        onClose={() => setShowSecuritySettings(false)}
      />
      
      <BackupManager 
        isOpen={showBackupManager}
        onClose={() => setShowBackupManager(false)}
      />
    </div>
  );
};

export default AdminDashboard;
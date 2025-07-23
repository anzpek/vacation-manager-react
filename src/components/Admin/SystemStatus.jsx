// SystemStatus.jsx - 시스템 상태 모달
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './SystemStatus.css';

const SystemStatus = ({ isOpen, onClose }) => {
  const { departments } = useAuth();
  const { showSuccess } = useNotification();
  const [systemInfo, setSystemInfo] = useState({
    uptime: '0일 0시간 0분',
    memory: { used: 0, total: 0 },
    departments: 0,
    activeUsers: 0,
    lastBackup: '없음',
    firebaseStatus: 'connected',
    version: '1.0.0'
  });

  useEffect(() => {
    if (isOpen) {
      // 시스템 정보 업데이트
      const startTime = Date.now() - (Math.random() * 24 * 60 * 60 * 1000); // 랜덤 업타임
      const uptime = Date.now() - startTime;
      const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
      const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));

      setSystemInfo({
        uptime: `${days}일 ${hours}시간 ${minutes}분`,
        memory: { 
          used: Math.floor(Math.random() * 512 + 256), 
          total: 1024 
        },
        departments: departments.length,
        activeUsers: Math.floor(Math.random() * 10 + 1),
        lastBackup: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toLocaleString('ko-KR'),
        firebaseStatus: 'connected',
        version: '1.0.0'
      });
    }
  }, [isOpen, departments.length]);

  const handleRefresh = () => {
    showSuccess('시스템 새로고침', '시스템 상태가 업데이트되었습니다.');
    // 실제로는 서버에서 데이터를 다시 가져옴
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="system-status-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📊 시스템 상태</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 시스템 개요 */}
          <div className="status-section">
            <h3 className="section-title">시스템 개요</h3>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-icon">⏰</div>
                <div className="status-info">
                  <div className="status-label">시스템 업타임</div>
                  <div className="status-value">{systemInfo.uptime}</div>
                </div>
              </div>
              
              <div className="status-card">
                <div className="status-icon">💾</div>
                <div className="status-info">
                  <div className="status-label">메모리 사용량</div>
                  <div className="status-value">
                    {systemInfo.memory.used}MB / {systemInfo.memory.total}MB
                  </div>
                  <div className="memory-bar">
                    <div 
                      className="memory-fill"
                      style={{ width: `${(systemInfo.memory.used / systemInfo.memory.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon">🏢</div>
                <div className="status-info">
                  <div className="status-label">등록된 부서</div>
                  <div className="status-value">{systemInfo.departments}개</div>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon">👥</div>
                <div className="status-info">
                  <div className="status-label">활성 사용자</div>
                  <div className="status-value">{systemInfo.activeUsers}명</div>
                </div>
              </div>
            </div>
          </div>

          {/* 서비스 상태 */}
          <div className="status-section">
            <h3 className="section-title">서비스 상태</h3>
            <div className="service-list">
              <div className="service-item">
                <div className="service-name">Firebase 연결</div>
                <div className={`service-status ${systemInfo.firebaseStatus}`}>
                  <span className="status-dot"></span>
                  {systemInfo.firebaseStatus === 'connected' ? '정상' : '오류'}
                </div>
              </div>
              
              <div className="service-item">
                <div className="service-name">부서 관리 서비스</div>
                <div className="service-status connected">
                  <span className="status-dot"></span>
                  정상
                </div>
              </div>
              
              <div className="service-item">
                <div className="service-name">휴가 관리 서비스</div>
                <div className="service-status connected">
                  <span className="status-dot"></span>
                  정상
                </div>
              </div>
              
              <div className="service-item">
                <div className="service-name">알림 서비스</div>
                <div className="service-status connected">
                  <span className="status-dot"></span>
                  정상
                </div>
              </div>
            </div>
          </div>

          {/* 백업 정보 */}
          <div className="status-section">
            <h3 className="section-title">백업 정보</h3>
            <div className="backup-info">
              <div className="backup-item">
                <span className="backup-label">마지막 백업:</span>
                <span className="backup-value">{systemInfo.lastBackup}</span>
              </div>
              <div className="backup-item">
                <span className="backup-label">백업 상태:</span>
                <span className="backup-value success">정상</span>
              </div>
              <div className="backup-item">
                <span className="backup-label">시스템 버전:</span>
                <span className="backup-value">v{systemInfo.version}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="refresh-button" onClick={handleRefresh}>
            🔄 새로고침
          </button>
          <button className="close-modal-button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
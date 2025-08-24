// BackupManager.jsx - 백업 관리 모달
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './BackupManager.css';

const BackupManager = ({ isOpen, onClose }) => {
  const { departments } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);

  // 백업 히스토리 생성 (실제로는 서버에서 가져옴)
  useEffect(() => {
    if (isOpen) {
      const mockHistory = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        mockHistory.push({
          id: `backup_${i}`,
          date: date.toISOString(),
          type: i === 0 ? 'auto' : Math.random() > 0.5 ? 'manual' : 'auto',
          size: Math.floor(Math.random() * 50 + 10) + 'MB',
          departments: Math.floor(Math.random() * departments.length + 1),
          status: Math.random() > 0.1 ? 'success' : 'failed',
          description: i === 0 ? '최신 자동 백업' : 
                      i === 1 ? '시스템 업데이트 전 백업' :
                      i === 2 ? '월간 정기 백업' :
                      `자동 백업 #${i}`
        });
      }
      setBackupHistory(mockHistory);
    }
  }, [isOpen, departments.length]);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    
    try {
      // 실제로는 서버에 백업 요청
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup = {
        id: `backup_${Date.now()}`,
        date: new Date().toISOString(),
        type: 'manual',
        size: Math.floor(Math.random() * 50 + 10) + 'MB',
        departments: departments.length,
        status: 'success',
        description: '수동 백업'
      };
      
      setBackupHistory(prev => [newBackup, ...prev]);
      showSuccess('백업 완료', '시스템 백업이 성공적으로 완료되었습니다.');
    } catch (error) {
      showError('백업 실패', '백업 생성 중 오류가 발생했습니다.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!window.confirm(`${new Date(backup.date).toLocaleString('ko-KR')} 백업으로 복원하시겠습니까?\n현재 데이터는 모두 삭제됩니다.`)) {
      return;
    }

    setIsRestoring(true);
    setSelectedBackup(backup.id);
    
    try {
      // 실제로는 서버에 복원 요청
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      showSuccess('복원 완료', '시스템이 성공적으로 복원되었습니다.');
    } catch (error) {
      showError('복원 실패', '백업 복원 중 오류가 발생했습니다.');
    } finally {
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  const handleDeleteBackup = (backupId) => {
    if (!window.confirm('이 백업을 삭제하시겠습니까?\n삭제된 백업은 복구할 수 없습니다.')) {
      return;
    }

    setBackupHistory(prev => prev.filter(backup => backup.id !== backupId));
    showSuccess('백업 삭제', '백업이 성공적으로 삭제되었습니다.');
  };

  const handleDownloadBackup = (backup) => {
    showSuccess('다운로드 시작', '백업 파일 다운로드가 시작됩니다.');
    // 실제로는 백업 파일 다운로드 로직
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    return status === 'success' ? '✅' : '❌';
  };

  const getTypeIcon = (type) => {
    return type === 'auto' ? '🔄' : '👤';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="backup-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">💾 백업 관리</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 백업 생성 섹션 */}
          <div className="backup-section">
            <h3 className="section-title">새 백업 생성</h3>
            <div className="backup-create">
              <div className="backup-info">
                <div className="info-item">
                  <span className="info-label">백업 대상:</span>
                  <span className="info-value">{departments.length}개 부서</span>
                </div>
                <div className="info-item">
                  <span className="info-label">예상 용량:</span>
                  <span className="info-value">약 {Math.floor(departments.length * 5 + 20)}MB</span>
                </div>
                <div className="info-item">
                  <span className="info-label">백업 타입:</span>
                  <span className="info-value">전체 시스템 백업</span>
                </div>
              </div>
              <button
                className="create-backup-button"
                onClick={handleCreateBackup}
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    백업 생성 중...
                  </>
                ) : (
                  <>
                    <span className="backup-icon">💾</span>
                    지금 백업하기
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 백업 히스토리 */}
          <div className="backup-section">
            <h3 className="section-title">백업 히스토리</h3>
            <div className="backup-history">
              {backupHistory.length === 0 ? (
                <div className="no-backups">
                  <div className="no-backup-icon">📦</div>
                  <div className="no-backup-text">생성된 백업이 없습니다</div>
                </div>
              ) : (
                <div className="backup-list">
                  {backupHistory.map((backup) => (
                    <div key={backup.id} className="backup-item">
                      <div className="backup-main-info">
                        <div className="backup-header">
                          <div className="backup-title">
                            {getTypeIcon(backup.type)}
                            <span className="backup-name">{backup.description}</span>
                            {getStatusIcon(backup.status)}
                          </div>
                          <div className="backup-date">
                            {formatDate(backup.date)}
                          </div>
                        </div>
                        <div className="backup-details">
                          <span className="backup-size">{backup.size}</span>
                          <span className="backup-departments">
                            {backup.departments}개 부서
                          </span>
                          <span className={`backup-status ${backup.status}`}>
                            {backup.status === 'success' ? '성공' : '실패'}
                          </span>
                        </div>
                      </div>

                      {backup.status === 'success' && (
                        <div className="backup-actions">
                          <button
                            className="action-button restore-button"
                            onClick={() => handleRestoreBackup(backup)}
                            disabled={isRestoring}
                            title="복원"
                          >
                            {isRestoring && selectedBackup === backup.id ? (
                              <span className="loading-spinner">⏳</span>
                            ) : (
                              '🔄'
                            )}
                          </button>
                          
                          <button
                            className="action-button download-button"
                            onClick={() => handleDownloadBackup(backup)}
                            title="다운로드"
                          >
                            📥
                          </button>
                          
                          <button
                            className="action-button delete-button"
                            onClick={() => handleDeleteBackup(backup.id)}
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 자동 백업 설정 */}
          <div className="backup-section">
            <h3 className="section-title">자동 백업 설정</h3>
            <div className="auto-backup-settings">
              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">자동 백업 주기</div>
                  <div className="setting-description">
                    시스템이 자동으로 백업을 생성하는 주기입니다.
                  </div>
                </div>
                <select className="setting-select">
                  <option value="daily">매일</option>
                  <option value="weekly">매주</option>
                  <option value="monthly">매월</option>
                  <option value="disabled">비활성화</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <div className="setting-label">보관 기간</div>
                  <div className="setting-description">
                    자동 생성된 백업을 보관할 기간입니다.
                  </div>
                </div>
                <select className="setting-select">
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                  <option value="90">90일</option>
                  <option value="365">1년</option>
                </select>
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

export default BackupManager;
// FirebaseStatus.jsx - Firebase 연결 상태 표시 컴포넌트
import React from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './FirebaseStatus.css';

const FirebaseStatus = () => {
  const { state } = useVacation();
  const { firebase } = state;

  const formatLastSyncTime = (timestamp) => {
    if (!timestamp) return '미동기화';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getStatusIcon = () => {
    if (firebase.syncing) return '🔄';
    if (firebase.connected) return '🟢';
    return '🔴';
  };

  const getStatusText = () => {
    if (firebase.syncing) return '동기화 중...';
    if (firebase.connected) return '실시간 연결됨';
    return '오프라인 모드';
  };

  const getStatusClass = () => {
    if (firebase.syncing) return 'syncing';
    if (firebase.connected) return 'connected';
    return 'disconnected';
  };

  return (
    <div className={`firebase-status ${getStatusClass()}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {firebase.connected && (
        <div className="sync-info">
          <span className="sync-time">
            마지막 동기화: {formatLastSyncTime(firebase.lastSyncTime)}
          </span>
        </div>
      )}
      
      {!firebase.connected && (
        <div className="offline-notice">
          데이터는 로컬에 저장되며, 연결 복구 시 자동 동기화됩니다.
        </div>
      )}
    </div>
  );
};

export default FirebaseStatus;
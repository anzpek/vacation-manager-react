import React from 'react';
import './PullToRefresh.css';

const PullToRefresh = ({ isPulling, pullDistance, isRefreshing, threshold = 100 }) => {
  // 진행률 계산 (0 ~ 1)
  const progress = Math.min(pullDistance / threshold, 1);
  
  // 회전 각도 계산
  const rotation = progress * 360;
  
  // 투명도 계산
  const opacity = Math.min(pullDistance / 50, 1);
  
  // 디버깅을 위해 항상 렌더링 (개발 중)
  // if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className={`pull-to-refresh ${isPulling ? 'pulling' : ''} ${isRefreshing ? 'refreshing' : ''}`}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold + 20)}px)`,
        opacity: opacity
      }}
    >
      <div className="refresh-indicator">
        {isRefreshing ? (
          <>
            <div className="refresh-spinner"></div>
            <span className="refresh-text">새로고침 중...</span>
          </>
        ) : (
          <>
            <div 
              className="refresh-arrow"
              style={{
                transform: `rotate(${rotation}deg)`,
                color: progress >= 1 ? '#28a745' : '#007bff'
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l0 10M8 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="refresh-text">
              {progress >= 1 ? '놓으면 새로고침' : '아래로 당겨서 새로고침'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default PullToRefresh;
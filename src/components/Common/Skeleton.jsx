// Skeleton.jsx - 로딩 상태 스켈레톤 컴포넌트
import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  width = '100%', 
  height = '16px', 
  variant = 'text',
  className = '',
  count = 1 
}) => {
  const skeletonClass = `skeleton skeleton-${variant} ${className}`;
  
  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className={skeletonClass}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={skeletonClass}
      style={{ width, height }}
    />
  );
};

// 캘린더 스켈레톤
export const CalendarSkeleton = () => (
  <div className="calendar-skeleton">
    <div className="calendar-header-skeleton">
      <Skeleton width="120px" height="24px" />
      <Skeleton width="200px" height="20px" />
    </div>
    
    <div className="calendar-weekdays-skeleton">
      {Array.from({ length: 7 }, (_, index) => (
        <Skeleton key={index} width="100%" height="16px" />
      ))}
    </div>
    
    <div className="calendar-grid-skeleton">
      {Array.from({ length: 35 }, (_, index) => (
        <div key={index} className="calendar-day-skeleton">
          <Skeleton width="20px" height="20px" variant="circular" />
          <div className="vacation-bars-skeleton">
            <Skeleton width="80%" height="12px" count={Math.floor(Math.random() * 3)} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 직원 목록 스켈레톤
export const EmployeeListSkeleton = () => (
  <div className="employee-list-skeleton">
    {Array.from({ length: 5 }, (_, index) => (
      <div key={index} className="employee-item-skeleton">
        <Skeleton width="40px" height="40px" variant="circular" />
        <div className="employee-info-skeleton">
          <Skeleton width="80px" height="16px" />
          <Skeleton width="60px" height="12px" />
        </div>
      </div>
    ))}
  </div>
);

// 통계 카드 스켈레톤
export const StatCardSkeleton = () => (
  <div className="stat-card-skeleton">
    <Skeleton width="24px" height="24px" variant="circular" />
    <div className="stat-info-skeleton">
      <Skeleton width="40px" height="24px" />
      <Skeleton width="60px" height="12px" />
    </div>
  </div>
);

export default Skeleton;
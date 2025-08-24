// NotificationContainer.jsx - 알림 컨테이너 컴포넌트
import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import './NotificationContainer.css';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification__icon">
            {getIcon(notification.type)}
          </div>
          
          <div className="notification__content">
            <div className="notification__header">
              <h4 className="notification__title">{notification.title}</h4>
              <span className="notification__time">
                {formatTime(notification.createdAt)}
              </span>
            </div>
            
            {notification.message && (
              <p className="notification__message">{notification.message}</p>
            )}
            
            {notification.employee && (
              <div className="notification__employee">
                <span className="notification__employee-name">
                  {notification.employee.name}
                </span>
                {notification.employee.team && (
                  <span className="notification__employee-team">
                    ({notification.employee.team})
                  </span>
                )}
              </div>
            )}
            
            {notification.date && (
              <div className="notification__date">
                📅 {new Date(notification.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </div>
            )}
          </div>
          
          <button
            className="notification__close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
            title="알림 닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
// NotificationContext.jsx - 알림 관리 컨텍스트
import React, { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL'
};

const initialState = {
  notifications: []
};

function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 5000, // 기본 5초
      createdAt: new Date(),
      ...notification
    };

    dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: newNotification });

    // 자동 제거 (duration이 0이면 수동 제거만)
    if (newNotification.duration > 0) {
      setTimeout(() => {
        dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  // 편의 함수들
  const showSuccess = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 5000, // 5초 후 자동 제거
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 5000, // 5초 후 자동 제거
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000, // 5초 후 자동 제거
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 5000, // 5초 후 자동 제거
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
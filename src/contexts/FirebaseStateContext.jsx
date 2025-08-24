import React, { createContext, useContext, useReducer, useCallback } from 'react';

const FirebaseStateContext = createContext();

// Firebase 상태 관련 액션들
const FIREBASE_ACTIONS = {
  SET_FIREBASE_CONNECTION: 'SET_FIREBASE_CONNECTION',
  SET_FIREBASE_SYNCING: 'SET_FIREBASE_SYNCING',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME'
};

// 초기 상태
const initialState = {
  connected: false,
  syncing: false,
  lastSyncTime: null
};

// Firebase 상태 리듀서
function firebaseStateReducer(state, action) {
  switch (action.type) {
    case FIREBASE_ACTIONS.SET_FIREBASE_CONNECTION:
      return {
        ...state,
        connected: action.payload,
        // 연결이 끊어지면 동기화 상태도 false로 설정
        syncing: action.payload ? state.syncing : false,
        // 연결이 끊어지면 마지막 동기화 시간 유지
        lastSyncTime: action.payload ? state.lastSyncTime : state.lastSyncTime
      };

    case FIREBASE_ACTIONS.SET_FIREBASE_SYNCING:
      return {
        ...state,
        syncing: action.payload,
        // 동기화가 완료되면(false가 되면) 현재 시간을 마지막 동기화 시간으로 설정
        lastSyncTime: !action.payload && state.syncing ? new Date().toISOString() : state.lastSyncTime
      };

    case FIREBASE_ACTIONS.SET_LAST_SYNC_TIME:
      return {
        ...state,
        lastSyncTime: action.payload
      };

    default:
      return state;
  }
}

// FirebaseState Provider
export function FirebaseStateProvider({ children }) {
  const [state, dispatch] = useReducer(firebaseStateReducer, initialState);

  // Actions
  const setFirebaseConnection = useCallback((connected) => {
    console.log('[FirebaseStateContext] Firebase 연결 상태 변경:', connected);
    dispatch({ type: FIREBASE_ACTIONS.SET_FIREBASE_CONNECTION, payload: connected });
  }, []);

  const setFirebaseSyncing = useCallback((syncing) => {
    console.log('[FirebaseStateContext] Firebase 동기화 상태 변경:', syncing);
    dispatch({ type: FIREBASE_ACTIONS.SET_FIREBASE_SYNCING, payload: syncing });
  }, []);

  const setLastSyncTime = useCallback((syncTime) => {
    const timeString = syncTime instanceof Date ? syncTime.toISOString() : syncTime;
    console.log('[FirebaseStateContext] 마지막 동기화 시간 설정:', timeString);
    dispatch({ type: FIREBASE_ACTIONS.SET_LAST_SYNC_TIME, payload: timeString });
  }, []);

  // 계산된 값들
  const isConnected = useCallback(() => {
    return state.connected;
  }, [state.connected]);

  const isSyncing = useCallback(() => {
    return state.syncing;
  }, [state.syncing]);

  const getConnectionStatus = useCallback(() => {
    if (state.connected) {
      return state.syncing ? 'syncing' : 'connected';
    }
    return 'disconnected';
  }, [state.connected, state.syncing]);

  const getLastSyncTimeFormatted = useCallback(() => {
    if (!state.lastSyncTime) return null;
    
    try {
      const syncDate = new Date(state.lastSyncTime);
      const now = new Date();
      const diffMs = now - syncDate;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return '방금 전';
      } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
      } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
      } else if (diffDays < 7) {
        return `${diffDays}일 전`;
      } else {
        return syncDate.toLocaleDateString('ko-KR');
      }
    } catch (error) {
      console.error('[FirebaseStateContext] 동기화 시간 포맷 오류:', error);
      return null;
    }
  }, [state.lastSyncTime]);

  const getConnectionStatusText = useCallback(() => {
    const status = getConnectionStatus();
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'syncing':
        return '동기화 중';
      case 'disconnected':
        return '연결 안됨';
      default:
        return '알 수 없음';
    }
  }, [getConnectionStatus]);

  const getSyncIndicatorColor = useCallback(() => {
    const status = getConnectionStatus();
    switch (status) {
      case 'connected':
        return '#10B981'; // green
      case 'syncing':
        return '#F59E0B'; // orange
      case 'disconnected':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  }, [getConnectionStatus]);

  const value = {
    // State
    connected: state.connected,
    syncing: state.syncing,
    lastSyncTime: state.lastSyncTime,
    
    // Actions
    setFirebaseConnection,
    setFirebaseSyncing,
    setLastSyncTime,
    
    // Computed values
    isConnected,
    isSyncing,
    getConnectionStatus,
    getLastSyncTimeFormatted,
    getConnectionStatusText,
    getSyncIndicatorColor
  };

  return (
    <FirebaseStateContext.Provider value={value}>
      {children}
    </FirebaseStateContext.Provider>
  );
}

// Hook
export function useFirebaseState() {
  const context = useContext(FirebaseStateContext);
  if (!context) {
    throw new Error('useFirebaseState must be used within a FirebaseStateProvider');
  }
  return context;
}

export default FirebaseStateContext;
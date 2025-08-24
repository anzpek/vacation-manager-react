import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import firebaseService from '../utils/firebaseService';

const VacationDataContext = createContext();

// 휴가 데이터 관련 액션들
const VACATION_ACTIONS = {
  SET_VACATIONS: 'SET_VACATIONS',
  ADD_VACATION: 'ADD_VACATION',
  UPDATE_VACATION: 'UPDATE_VACATION',
  DELETE_VACATION: 'DELETE_VACATION',
  DELETE_VACATION_DAY: 'DELETE_VACATION_DAY',
  DELETE_CONSECUTIVE_VACATIONS: 'DELETE_CONSECUTIVE_VACATIONS'
};

// 초기 상태
const initialState = {
  vacations: []
};

// 휴가 데이터 리듀서
function vacationDataReducer(state, action) {
  switch (action.type) {
    case VACATION_ACTIONS.SET_VACATIONS:
      return {
        ...state,
        vacations: action.payload
      };

    case VACATION_ACTIONS.ADD_VACATION:
      return {
        ...state,
        vacations: [...state.vacations, action.payload]
      };

    case VACATION_ACTIONS.UPDATE_VACATION:
      return {
        ...state,
        vacations: state.vacations.map(v =>
          v.id === action.payload.id ? action.payload : v
        )
      };

    case VACATION_ACTIONS.DELETE_VACATION:
      return {
        ...state,
        vacations: state.vacations.filter(v => v.id !== action.payload)
      };

    case VACATION_ACTIONS.DELETE_VACATION_DAY:
      const { vacationId, date } = action.payload;
      return {
        ...state,
        vacations: state.vacations.filter(v => !(v.id === vacationId && v.date === date))
      };

    case VACATION_ACTIONS.DELETE_CONSECUTIVE_VACATIONS:
      const { startDate, endDate, employeeId } = action.payload;
      const start = new Date(startDate);
      const end = new Date(endDate);
      return {
        ...state,
        vacations: state.vacations.filter(v => {
          if (v.employeeId !== employeeId) return true;
          const vacDate = new Date(v.date);
          return !(vacDate >= start && vacDate <= end);
        })
      };

    default:
      return state;
  }
}

// VacationData Provider
export function VacationDataProvider({ children }) {
  const [state, dispatch] = useReducer(vacationDataReducer, initialState);
  const { currentDepartment } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Storage 관련 함수들
  const getStorageKey = useCallback((key) => {
    return currentDepartment?.code ? `vacation_${currentDepartment.code}_${key}` : `vacation_local_${key}`;
  }, [currentDepartment]);

  const saveData = useCallback((key, data) => {
    const storageKey = getStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [getStorageKey]);

  // Actions
  const setVacations = useCallback((vacations) => {
    dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: vacations });
    saveData('vacations', vacations);
  }, [saveData]);

  const addVacation = useCallback((vacation) => {
    dispatch({ type: VACATION_ACTIONS.ADD_VACATION, payload: vacation });
    showSuccess(`${vacation.employeeName}님의 휴가가 추가되었습니다.`);
  }, [showSuccess]);

  const updateVacation = useCallback((vacation) => {
    dispatch({ type: VACATION_ACTIONS.UPDATE_VACATION, payload: vacation });
    showSuccess('휴가가 수정되었습니다.');
  }, [showSuccess]);

  const deleteVacation = useCallback((vacationId) => {
    dispatch({ type: VACATION_ACTIONS.DELETE_VACATION, payload: vacationId });
    showSuccess('휴가가 삭제되었습니다.');
  }, [showSuccess]);

  const deleteVacationDay = useCallback((vacationId, date) => {
    dispatch({ 
      type: VACATION_ACTIONS.DELETE_VACATION_DAY, 
      payload: { vacationId, date } 
    });
    showSuccess('해당 날짜의 휴가가 삭제되었습니다.');
  }, [showSuccess]);

  const deleteConsecutiveVacations = useCallback((startDate, endDate, employeeId) => {
    dispatch({ 
      type: VACATION_ACTIONS.DELETE_CONSECUTIVE_VACATIONS, 
      payload: { startDate, endDate, employeeId } 
    });
    showSuccess('연속 휴가가 삭제되었습니다.');
  }, [showSuccess]);

  // 계산된 값들
  const getVacationsByDate = useCallback((dateStr) => {
    return state.vacations.filter(v => v.date === dateStr);
  }, [state.vacations]);

  const getVacationsByEmployee = useCallback((employeeId) => {
    return state.vacations.filter(v => v.employeeId === employeeId);
  }, [state.vacations]);

  const getMonthlyVacations = useCallback((year, month) => {
    return state.vacations.filter(v => {
      const vacDate = new Date(v.date);
      return vacDate.getFullYear() === year &&
             vacDate.getMonth() === month;
    });
  }, [state.vacations]);

  // Firebase에서 휴가 데이터 로드
  useEffect(() => {
    const loadVacationsFromFirebase = async () => {
      if (!currentDepartment?.code) return;

      try {
        console.log(`🔄 [${currentDepartment.code}] Firebase에서 휴가 데이터 로딩 중...`);
        const firebaseVacations = await firebaseService.getVacations(currentDepartment.code);
        
        if (firebaseVacations && firebaseVacations.length > 0) {
          console.log(`✅ [${currentDepartment.code}] Firebase에서 휴가 ${firebaseVacations.length}개 로드됨`);
          dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: firebaseVacations });
          saveData('vacations', firebaseVacations);
        } else {
          console.log(`📭 [${currentDepartment.code}] Firebase에 휴가 데이터 없음`);
        }
      } catch (error) {
        console.error('Firebase 휴가 데이터 로드 실패:', error);
      }
    };

    loadVacationsFromFirebase();
  }, [currentDepartment?.code, saveData]);

  const value = {
    // State
    vacations: state.vacations,
    
    // Actions
    setVacations,
    addVacation,
    updateVacation,
    deleteVacation,
    deleteVacationDay,
    deleteConsecutiveVacations,
    
    // Computed values
    getVacationsByDate,
    getVacationsByEmployee,
    getMonthlyVacations
  };

  return (
    <VacationDataContext.Provider value={value}>
      {children}
    </VacationDataContext.Provider>
  );
}

// Hook
export function useVacationData() {
  const context = useContext(VacationDataContext);
  if (!context) {
    throw new Error('useVacationData must be used within a VacationDataProvider');
  }
  return context;
}

export default VacationDataContext;
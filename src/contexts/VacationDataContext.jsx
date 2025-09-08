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

  const addVacation = useCallback(async (vacation) => {
    try {
      // ID가 없는 경우 생성
      const newVacation = {
        ...vacation,
        id: vacation.id || Date.now() + Math.floor(Math.random() * 1000),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Firebase에 저장 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.addVacation(currentDepartment.code, newVacation);
        if (result.success) {
          // Firebase 저장 성공 시 반환된 데이터 사용
          dispatch({ type: VACATION_ACTIONS.ADD_VACATION, payload: result.vacation });
          showSuccess(`${newVacation.employeeName}님의 휴가가 추가되었습니다.`);
          return result.vacation;
        } else {
          throw new Error('Firebase 저장 실패');
        }
      } else {
        // 로컬 전용 모드
        dispatch({ type: VACATION_ACTIONS.ADD_VACATION, payload: newVacation });
        showSuccess(`${newVacation.employeeName}님의 휴가가 추가되었습니다.`);
        return newVacation;
      }
    } catch (error) {
      console.error('휴가 추가 실패:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment]);

  const updateVacation = useCallback(async (vacation) => {
    try {
      // Firebase에서 수정 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.updateVacation(
          currentDepartment.code, 
          vacation.id, 
          vacation
        );
        
        if (result.success) {
          dispatch({ type: VACATION_ACTIONS.UPDATE_VACATION, payload: vacation });
          showSuccess('휴가가 수정되었습니다.');
          
          // 로컬 스토리지도 업데이트
          const updatedVacations = state.vacations.map(v =>
            v.id === vacation.id ? vacation : v
          );
          saveData('vacations', updatedVacations);
          return vacation;
        } else {
          console.error('Firebase 휴가 수정 실패:', result.error);
          // Firebase 실패 시에도 로컬은 업데이트
          dispatch({ type: VACATION_ACTIONS.UPDATE_VACATION, payload: vacation });
          showSuccess('휴가가 수정되었습니다. (오프라인 모드)');
          
          // 로컬 스토리지 업데이트
          const updatedVacations = state.vacations.map(v =>
            v.id === vacation.id ? vacation : v
          );
          saveData('vacations', updatedVacations);
          return vacation;
        }
      } else {
        // 부서 정보가 없으면 로컬만 업데이트
        dispatch({ type: VACATION_ACTIONS.UPDATE_VACATION, payload: vacation });
        
        const updatedVacations = state.vacations.map(v =>
          v.id === vacation.id ? vacation : v
        );
        saveData('vacations', updatedVacations);
        showSuccess('휴가가 수정되었습니다.');
        return vacation;
      }
    } catch (error) {
      console.error('휴가 수정 중 오류 발생:', error);
      // 에러 발생 시에도 로컬은 업데이트
      dispatch({ type: VACATION_ACTIONS.UPDATE_VACATION, payload: vacation });
      
      const updatedVacations = state.vacations.map(v =>
        v.id === vacation.id ? vacation : v
      );
      saveData('vacations', updatedVacations);
      showSuccess('휴가가 수정되었습니다. (오프라인 모드)');
      return vacation;
    }
  }, [showSuccess, currentDepartment, state.vacations, saveData]);

  const deleteVacation = useCallback(async (vacationId) => {
    try {
      // Firebase에서 삭제 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.deleteVacation(currentDepartment.code, vacationId);
        if (result.success) {
          dispatch({ type: VACATION_ACTIONS.DELETE_VACATION, payload: vacationId });
          showSuccess('휴가가 삭제되었습니다.');
          
          // 로컬 스토리지도 업데이트
          const updatedVacations = state.vacations.filter(v => v.id !== vacationId);
          saveData('vacations', updatedVacations);
          return true;
        } else {
          throw new Error('Firebase 삭제 실패');
        }
      } else {
        // 로컬 전용 모드
        dispatch({ type: VACATION_ACTIONS.DELETE_VACATION, payload: vacationId });
        showSuccess('휴가가 삭제되었습니다.');
        return true;
      }
    } catch (error) {
      console.error('휴가 삭제 실패:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment, state.vacations, saveData]);

  const deleteVacationDay = useCallback(async (vacationId, date) => {
    try {
      // Firebase에서 삭제 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.deleteVacation(currentDepartment.code, vacationId);
        if (result.success) {
          dispatch({ 
            type: VACATION_ACTIONS.DELETE_VACATION_DAY, 
            payload: { vacationId, date } 
          });
          showSuccess('해당 날짜의 휴가가 삭제되었습니다.');
          return true;
        } else {
          throw new Error('Firebase 삭제 실패');
        }
      } else {
        // 로컬 전용 모드
        dispatch({ 
          type: VACATION_ACTIONS.DELETE_VACATION_DAY, 
          payload: { vacationId, date } 
        });
        showSuccess('해당 날짜의 휴가가 삭제되었습니다.');
        return true;
      }
    } catch (error) {
      console.error('휴가 삭제 실패:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment, saveData]);

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
    const loadAllVacationData = async () => {
      if (!currentDepartment?.code) return;

      try {
        // 1. 먼저 로컬 스토리지에서 캐시된 데이터 로드
        const storageKey = getStorageKey('vacations');
        const cachedVacations = localStorage.getItem(storageKey);
        if (cachedVacations) {
          const parsedVacations = JSON.parse(cachedVacations);
          console.log(`📱 [${currentDepartment.code}] 로컬에서 휴가 ${parsedVacations.length}개 로드됨`);
          dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: parsedVacations });
        }

        // 2. Firebase에서 최신 데이터 로드하고 동기화
        console.log(`🔄 [${currentDepartment.code}] Firebase에서 휴가 데이터 로딩 중...`);
        const firebaseVacations = await firebaseService.getVacations(currentDepartment.code);
        
        // Firebase 데이터를 항상 우선시 (빈 배열이라도 캐시보다 신뢰할 수 있음)
        console.log(`✅ [${currentDepartment.code}] Firebase에서 휴가 ${firebaseVacations?.length || 0}개 로드됨`);
        const finalVacations = firebaseVacations || [];
        dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: finalVacations });
        saveData('vacations', finalVacations);
      } catch (error) {
        console.error('휴가 데이터 로드 실패:', error);
        // Firebase 실패 시 로컬 데이터라도 유지
      }
    };

    loadAllVacationData();
  }, [currentDepartment?.code, getStorageKey, saveData]);

  // state.vacations 변경 시 자동으로 로컬 스토리지 업데이트
  useEffect(() => {
    if (currentDepartment?.code && state.vacations.length >= 0) {
      saveData('vacations', state.vacations);
    }
  }, [state.vacations, currentDepartment?.code, saveData]);

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
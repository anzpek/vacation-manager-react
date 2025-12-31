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
      const { vacationId } = action.payload;
      console.log(`🗑️ [Reducer] DELETE_VACATION_DAY: ID=${vacationId}`);
      console.log(`📊 [Reducer] 삭제 전 휴가 개수: ${state.vacations.length}`);
      const filteredVacations = state.vacations.filter(v => v.id !== vacationId);
      console.log(`📊 [Reducer] 삭제 후 휴가 개수: ${filteredVacations.length}`);
      return {
        ...state,
        vacations: filteredVacations
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

  // 로컬 캐시 완전 비활성화 - Firebase만 사용

  // Actions
  const setVacations = useCallback((vacations) => {
    dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: vacations });
  }, []);

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
          return vacation;
        } else {
          console.error('Firebase 휴가 수정 실패:', result.error);
          throw new Error('Firebase 휴가 수정 실패');
        }
      } else {
        throw new Error('부서 정보가 없습니다.');
      }
    } catch (error) {
      console.error('휴가 수정 중 오류 발생:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment]);

  const deleteVacation = useCallback(async (vacationId) => {
    try {
      // Firebase에서 삭제 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.deleteVacation(currentDepartment.code, vacationId);
        if (result.success) {
          dispatch({ type: VACATION_ACTIONS.DELETE_VACATION, payload: vacationId });
          showSuccess('휴가가 삭제되었습니다.');
          return true;
        } else {
          throw new Error('Firebase 삭제 실패');
        }
      } else {
        throw new Error('부서 정보가 없습니다.');
      }
    } catch (error) {
      console.error('휴가 삭제 실패:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment]);

  const deleteVacationDay = useCallback(async (vacationId, date) => {
    console.log(`🗑️ [VacationDataContext] deleteVacationDay 시작: ID=${vacationId}, date=${date}`);
    console.log(`📊 [VacationDataContext] 삭제 전 휴가 개수: ${state.vacations.length}`);

    try {
      // Firebase에서 삭제 시도
      if (currentDepartment?.code) {
        const result = await firebaseService.deleteVacation(currentDepartment.code, vacationId);
        if (result.success) {
          console.log(`✅ [VacationDataContext] Firebase 삭제 성공, dispatch 호출 중...`);
          dispatch({
            type: VACATION_ACTIONS.DELETE_VACATION_DAY,
            payload: { vacationId, date }
          });
          console.log(`📊 [VacationDataContext] dispatch 호출 완료`);
          showSuccess('해당 날짜의 휴가가 삭제되었습니다.');
          return true;
        } else {
          throw new Error('Firebase 삭제 실패');
        }
      } else {
        throw new Error('부서 정보가 없습니다.');
      }
    } catch (error) {
      console.error('휴가 삭제 실패:', error);
      throw error;
    }
  }, [showSuccess, currentDepartment, state.vacations]);

  const deleteConsecutiveVacations = useCallback(async (startDate, endDate, employeeId) => {
    try {
      console.log(`🗑️ [VacationDataContext] 연휴 일괄 삭제 시작: ${startDate} ~ ${endDate}, 직원ID: ${employeeId}`);

      if (currentDepartment?.code) {
        // 삭제 대상 휴가 찾기
        const start = new Date(startDate);
        const end = new Date(endDate);

        // 날짜 비교를 위해 시간 제거
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const targetVacations = state.vacations.filter(v => {
          if (v.employeeId !== employeeId) return false;
          const vacDate = new Date(v.date);
          vacDate.setHours(0, 0, 0, 0);
          return vacDate >= start && vacDate <= end;
        });

        console.log(`📊 [VacationDataContext] 삭제 대상 휴가: ${targetVacations.length}개`);

        // Firebase에서 하나씩 삭제
        // Promise.all로 병렬 처리하여 속도 향상
        const deletePromises = targetVacations.map(v =>
          firebaseService.deleteVacation(currentDepartment.code, v.id)
            .then(result => {
              if (!result.success) throw new Error(`휴가 삭제 실패: ${v.id}`);
              return result;
            })
        );

        await Promise.all(deletePromises);
        console.log(`✅ [VacationDataContext] Firebase에서 모든 연휴 데이터 삭제 완료`);
      }

      // 로컬 상태 업데이트
      dispatch({
        type: VACATION_ACTIONS.DELETE_CONSECUTIVE_VACATIONS,
        payload: { startDate, endDate, employeeId }
      });
      showSuccess('연속 휴가가 삭제되었습니다.');

    } catch (error) {
      console.error('연속 휴가 삭제 실패:', error);
      // 에러 발생 시 사용자에게 알림 (여기서는 console만 찍음, 필요시 UI 에러 처리 추가)
    }
  }, [showSuccess, currentDepartment, state.vacations]);

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

  // Firebase에서 휴가 데이터 로드 (로컬 캐시 비활성화)
  useEffect(() => {
    const loadVacationDataFromFirebase = async () => {
      if (!currentDepartment?.code) return;

      try {
        console.log(`🔄 [${currentDepartment.code}] Firebase에서 휴가 데이터 로딩 중...`);
        const firebaseVacations = await firebaseService.getVacations(currentDepartment.code);

        console.log(`✅ [${currentDepartment.code}] Firebase에서 휴가 ${firebaseVacations?.length || 0}개 로드됨`);
        const finalVacations = firebaseVacations || [];
        dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: finalVacations });
      } catch (error) {
        console.error('Firebase 휴가 데이터 로드 실패:', error);
        // Firebase 실패 시 빈 배열로 초기화
        dispatch({ type: VACATION_ACTIONS.SET_VACATIONS, payload: [] });
      }
    };

    loadVacationDataFromFirebase();
  }, [currentDepartment?.code]);

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
import React, { createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { VacationDataProvider, useVacationData } from './VacationDataContext';
import { EmployeeDataProvider, useEmployeeData } from './EmployeeDataContext';
import { UIStateProvider, useUIState } from './UIStateContext';
import { FiltersProvider, useFilters } from './FiltersContext';
import { FirebaseStateProvider, useFirebaseState } from './FirebaseStateContext';
import { useNotification } from './NotificationContext';

// 통합 VacationContext
const VacationContext = createContext();

// 날짜 및 공휴일 관리를 위한 로컬 상태
function VacationIntegrationProvider({ children }) {
  const { currentDepartment } = useAuth();
  
  // 모든 하위 컨텍스트 hooks 사용
  const vacationData = useVacationData();
  const employeeData = useEmployeeData();
  const uiState = useUIState();
  const filters = useFilters();
  const firebaseState = useFirebaseState();

  // 날짜 관련 상태 (로컬 관리)
  const [dateState, setDateState] = React.useState({
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth(),
    holidays: {}
  });

  // Storage 관련 함수들
  const getStorageKey = useCallback((key) => {
    return currentDepartment?.code ? `vacation_${currentDepartment.code}_${key}` : `vacation_local_${key}`;
  }, [currentDepartment]);



  // 날짜 관리 함수들
  const setDate = useCallback((year, month) => {
    setDateState(prev => ({
      ...prev,
      selectedYear: year,
      selectedMonth: month
    }));
  }, []);

  const setSelectedDate = useCallback((year, month) => {
    setDate(year, month);
  }, [setDate]);

  const setHolidays = useCallback((holidays) => {
    setDateState(prev => ({
      ...prev,
      holidays
    }));
  }, []);

  // 통합된 액션들
  const actions = {
    // 직원 관리 (EmployeeDataContext에서 가져옴)
    ...employeeData,
    
    // 휴가 관리 (VacationDataContext에서 가져옴)
    ...vacationData,
    
    // UI 관리 (UIStateContext에서 가져옴)
    ...uiState,
    
    // 필터 관리 (FiltersContext에서 가져옴)
    ...filters,
    
    // Firebase 상태 관리 (FirebaseStateContext에서 가져옴)
    ...firebaseState,
    
    // 날짜 관리 (로컬)
    setDate,
    setSelectedDate,
    setHolidays,

    // 배치 휴가 추가 (기존 로직 유지)
    addBatchVacations: useCallback((vacations, newEmployees) => {
      // 새 직원 추가
      const newEmployeeObjects = newEmployees.map(name => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        team: '기타',
        position: 'member'
      }));
      
      newEmployeeObjects.forEach(emp => employeeData.addEmployee(emp));

      // 휴가 추가
      const newVacations = vacations.map(v => {
        const employee = [...employeeData.employees, ...newEmployeeObjects].find(e => e.name === v.employeeName);
        
        let dateString;
        if (typeof v.date === 'string') {
          dateString = v.date;
        } else {
          const year = v.date.getFullYear();
          const month = String(v.date.getMonth() + 1).padStart(2, '0');
          const day = String(v.date.getDate()).padStart(2, '0');
          dateString = `${year}-${month}-${day}`;
        }
        
        return {
          id: Date.now() + Math.floor(Math.random() * 1000),
          employeeId: employee.id,
          date: dateString,
          type: v.type
        };
      });
      
      newVacations.forEach(vac => vacationData.addVacation(vac));
    }, [employeeData, vacationData]),

    // 데이터 정리 및 검증 함수들
    cleanupOrphanedVacations: useCallback(() => {
      const validEmployeeIds = employeeData.employees.map(emp => emp.id);
      const cleanedVacations = vacationData.vacations.filter(vacation => {
        const isValid = validEmployeeIds.includes(vacation.employeeId);
        if (!isValid) {
          console.log(`[DataCleanup] 고아 휴가 제거: ID ${vacation.id}, 직원ID ${vacation.employeeId}, 날짜 ${vacation.date}`);
        }
        return isValid;
      });

      const removedCount = vacationData.vacations.length - cleanedVacations.length;
      
      if (removedCount > 0) {
        vacationData.setVacations(cleanedVacations);
        console.log(`[DataCleanup] ${removedCount}개의 고아 휴가가 제거되었습니다.`);
        return removedCount;
      }
      
      return 0;
    }, [employeeData.employees, vacationData]),

    // 갈등 감지
    detectConflicts: useCallback((vacation) => {
      const conflicts = vacationData.vacations.filter(v => {
        return v.id !== vacation.id &&
               v.employeeId === vacation.employeeId &&
               v.date === vacation.date;
      });
      
      console.log(`[VacationContext] 🔍 detectConflicts:`, {
        inputVacation: vacation,
        totalVacations: vacationData.vacations.length,
        conflicts: conflicts.length,
        conflictDetails: conflicts.map(v => ({ id: v.id, date: v.date, type: v.type }))
      });
      
      return conflicts;
    }, [vacationData.vacations])
  };

  // 계산된 값들 (기존 로직 유지)
  const computed = {
    // 필터링된 직원 목록
    filteredEmployees: useCallback(() => {
      return employeeData.employees.filter(employee => filters.shouldShowEmployee(employee));
    }, [employeeData.employees, filters.shouldShowEmployee]),

    // 특정 날짜의 휴가 목록
    getVacationsByDate: useCallback((date) => {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      return vacationData.getVacationsByDate(dateStr);
    }, [vacationData.getVacationsByDate]),

    // 특정 직원의 휴가 목록
    getVacationsByEmployee: useCallback((employeeId) => {
      return vacationData.getVacationsByEmployee(employeeId);
    }, [vacationData.getVacationsByEmployee]),

    // 월별 휴가 통계
    getMonthlyStats: useCallback(() => {
      const monthVacations = vacationData.vacations.filter(v => {
        const vacDate = new Date(v.date);
        return vacDate.getFullYear() === dateState.selectedYear &&
               vacDate.getMonth() === dateState.selectedMonth;
      });

      const stats = {
        total: monthVacations.length,
        byType: {},
        byEmployee: {}
      };

      monthVacations.forEach(vacation => {
        stats.byType[vacation.type] = (stats.byType[vacation.type] || 0) + 1;
        stats.byEmployee[vacation.employeeId] = (stats.byEmployee[vacation.employeeId] || 0) + 1;
      });

      return stats;
    }, [vacationData.vacations, dateState.selectedYear, dateState.selectedMonth]),

    // 월별 휴가 목록
    getMonthlyVacations: useCallback((year, month) => {
      return vacationData.getMonthlyVacations(year, month);
    }, [vacationData.getMonthlyVacations])
  };

  // 통합된 상태
  const state = {
    // 직원 데이터
    employees: employeeData.employees,
    
    // 부서 데이터 (AuthContext에서 가져옴)
    departments: currentDepartment ? [currentDepartment] : [],
    
    // 휴가 데이터
    vacations: vacationData.vacations,
    
    // 날짜 상태
    selectedYear: dateState.selectedYear,
    selectedMonth: dateState.selectedMonth,
    holidays: dateState.holidays,
    
    // 필터 상태
    filters: {
      selectedTeams: filters.selectedTeams,
      selectedEmployees: filters.selectedEmployees,
      vacationTypes: filters.vacationTypes
    },
    
    // UI 상태
    ui: {
      loading: uiState.loading,
      error: uiState.error,
      selectedDate: uiState.selectedDate,
      activeModal: uiState.activeModal,
      modalProps: uiState.modalProps,
      previousModal: uiState.previousModal,
      holidaysLoaded: uiState.holidaysLoaded,
      mobileFilterOpen: uiState.mobileFilterOpen
    },
    
    // Firebase 상태
    firebase: {
      connected: firebaseState.connected,
      syncing: firebaseState.syncing,
      lastSyncTime: firebaseState.lastSyncTime
    }
  };

  const value = {
    state,
    actions,
    computed,
    currentDepartment
  };

  return (
    <VacationContext.Provider value={value}>
      {children}
    </VacationContext.Provider>
  );
}

// 메인 Provider (모든 하위 컨텍스트를 감싸는 컴포넌트)
export function VacationProvider({ children }) {
  return (
    <FirebaseStateProvider>
      <UIStateProvider>
        <FiltersProvider>
          <EmployeeDataProvider>
            <VacationDataProvider>
              <VacationIntegrationProvider>
                {children}
              </VacationIntegrationProvider>
            </VacationDataProvider>
          </EmployeeDataProvider>
        </FiltersProvider>
      </UIStateProvider>
    </FirebaseStateProvider>
  );
}

// Hook
export function useVacation() {
  const context = useContext(VacationContext);
  if (!context) {
    throw new Error('useVacation must be used within a VacationProvider');
  }
  return context;
}

export default VacationContext;
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import firebaseService from '../utils/firebaseService';

const EmployeeDataContext = createContext();

// 직원 데이터 관련 액션들
const EMPLOYEE_ACTIONS = {
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE'
};

// 초기 상태
const initialState = {
  employees: []
};

// 직원 데이터 리듀서
function employeeDataReducer(state, action) {
  switch (action.type) {
    case EMPLOYEE_ACTIONS.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload
      };

    case EMPLOYEE_ACTIONS.ADD_EMPLOYEE:
      return {
        ...state,
        employees: [...state.employees, action.payload]
      };

    case EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.id ? action.payload : e
        )
      };

    case EMPLOYEE_ACTIONS.DELETE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload)
      };

    default:
      return state;
  }
}

// 색상 팔레트 정의
const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', // Blue, Green, Orange, Red, Purple
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1', // Cyan, Lime, Dark Orange, Pink, Indigo
  '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626', // Teal, Rose, Brown, Gray, Dark Red
  '#7C3AED', '#059669', '#D97706', '#BE185D', '#4338CA', // Violet, Emerald, Amber, Ruby, Dark Blue
  '#A855F7', '#22D3EE', '#FACC15', '#FB7185', '#A78BFA', // Light Purple, Sky Blue, Yellow, Rose Pink, Light Indigo
  '#4ADE80', '#F472B6', '#6EE7B7', '#F87171', '#9CA3AF', // Light Green, Light Pink, Mint, Light Red, Dark Gray
  '#D946EF', '#34D399', '#FBBF24', '#FCA5A5', '#C4B5FD', // Magenta, Medium Green, Gold, Light Red, Lavender
  '#60A5FA', '#F0ABFC', '#A3E635', '#FDBA74', '#FDA4AF'  // Royal Blue, Light Purple, Chartreuse, Peach, Coral
];

// EmployeeData Provider
export function EmployeeDataProvider({ children }) {
  const [state, dispatch] = useReducer(employeeDataReducer, initialState);
  const { currentDepartment, currentUser } = useAuth();
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
  const setEmployees = useCallback((employees) => {
    dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: employees });
    saveData('employees', employees);
  }, [saveData]);

  const addEmployee = useCallback((employee) => {
    // 현재 직원들의 색상을 다시 가져오기
    const storageKey = getStorageKey('employees');
    const currentEmployees = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const usedColors = currentEmployees.map(emp => emp.color).filter(Boolean);

    // 사용되지 않은 색상 찾기
    const availableColors = COLOR_PALETTE.filter(color => !usedColors.includes(color));

    // 색상 할당
    let assignedColor;
    if (employee.color && employee.color !== null) {
      assignedColor = employee.color;
    } else if (availableColors.length > 0) {
      assignedColor = availableColors[0];
    } else {
      assignedColor = COLOR_PALETTE[currentEmployees.length % COLOR_PALETTE.length];
    }

    const newEmployee = {
      ...employee,
      id: Date.now() + Math.floor(Math.random() * 1000),
      color: assignedColor
    };

    dispatch({ type: EMPLOYEE_ACTIONS.ADD_EMPLOYEE, payload: newEmployee });

    const updatedEmployees = [...currentEmployees, newEmployee];
    saveData('employees', updatedEmployees);

    // Firebase에 저장 (Real User일 때만)
    const isMockUser = currentUser?.email?.includes('@company.com') || currentUser?.uid?.startsWith('user-');
    if (currentDepartment?.code && !isMockUser) {
      firebaseService.saveEmployees(currentDepartment.code, updatedEmployees);
    }

    // 사용자 데이터 생성 플래그 설정 (데이터 보존용)
    localStorage.setItem(getStorageKey('employees_ever_created'), 'true');
    localStorage.setItem('user_data_exists', 'true');
    sessionStorage.setItem('user_data_exists', 'true');

    // 알림 표시
    showSuccess(
      '직원 추가 완료',
      `${newEmployee.name}님이 ${newEmployee.team} 팀에 추가되었습니다.`,
      { employee: newEmployee }
    );

    return newEmployee;
  }, [dispatch, getStorageKey, saveData, showSuccess, currentDepartment, currentUser]);

  const updateEmployee = useCallback((employee) => {
    dispatch({ type: EMPLOYEE_ACTIONS.UPDATE_EMPLOYEE, payload: employee });

    const updatedEmployees = state.employees.map(e =>
      e.id === employee.id ? employee : e
    );
    saveData('employees', updatedEmployees);

    // Firebase에 저장 (Real User일 때만)
    const isMockUser = currentUser?.email?.includes('@company.com') || currentUser?.uid?.startsWith('user-');
    if (currentDepartment?.code && !isMockUser) {
      firebaseService.saveEmployees(currentDepartment.code, updatedEmployees);
    }

    showSuccess('직원 정보가 수정되었습니다.');
  }, [state.employees, saveData, showSuccess, currentDepartment, currentUser]);

  const deleteEmployee = useCallback((employeeId) => {
    dispatch({ type: EMPLOYEE_ACTIONS.DELETE_EMPLOYEE, payload: employeeId });

    // localStorage에서도 제거
    const empStorageKey = getStorageKey('employees');
    const vacStorageKey = getStorageKey('vacations');
    const currentEmployees = JSON.parse(localStorage.getItem(empStorageKey) || '[]');
    const currentVacations = JSON.parse(localStorage.getItem(vacStorageKey) || '[]');

    const updatedEmployees = currentEmployees.filter(e => e.id !== employeeId);
    const updatedVacations = currentVacations.filter(v => v.employeeId !== employeeId);

    saveData('employees', updatedEmployees);
    saveData('vacations', updatedVacations);

    // Firebase에 저장 (Real User일 때만)
    const isMockUser = currentUser?.email?.includes('@company.com') || currentUser?.uid?.startsWith('user-');
    if (currentDepartment?.code && !isMockUser) {
      firebaseService.saveEmployees(currentDepartment.code, updatedEmployees);
      firebaseService.saveVacations(currentDepartment.code, updatedVacations);
    }

    showSuccess('직원 및 관련 휴가가 삭제되었습니다.');

    // 관련 휴가 삭제 알림을 위해 삭제된 휴가 수 반환
    return { deletedVacationsCount: currentVacations.length - updatedVacations.length };
  }, [getStorageKey, saveData, showSuccess, currentDepartment, currentUser]);

  // 계산된 값들
  const getEmployeeById = useCallback((employeeId) => {
    return state.employees.find(emp => emp.id === employeeId);
  }, [state.employees]);

  const getEmployeesByTeam = useCallback((team) => {
    return state.employees.filter(emp => emp.team === team);
  }, [state.employees]);

  const getTeams = useCallback(() => {
    const teams = [...new Set(state.employees.map(emp => emp.team))];
    return teams.sort();
  }, [state.employees]);

  const getUsedColors = useCallback(() => {
    return state.employees.map(emp => emp.color).filter(Boolean);
  }, [state.employees]);

  const getAvailableColors = useCallback(() => {
    const usedColors = getUsedColors();
    return COLOR_PALETTE.filter(color => !usedColors.includes(color));
  }, [getUsedColors]);

  // Firebase에서 직원 데이터 로드
  useEffect(() => {
    const loadEmployeesFromFirebase = async () => {
      if (!currentDepartment?.code) return;

      // 🛑 Mock User(비밀번호 로그인)인 경우 Firebase 동기화 하지 않음 (로컬 전용)
      // Mock User는 uid가 'user-'로 시작하거나 email이 '@company.com'으로 끝남
      const isMockUser = currentDepartment.uid?.startsWith('user-') ||
        (currentUser?.email?.includes('@company.com'));

      if (isMockUser) {
        console.log(`🔒 [${currentDepartment.code}] Mock User 모드: 로컬 직원 데이터만 사용`);
        const localEmployees = JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
        if (localEmployees.length > 0) {
          dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: localEmployees });
        }
        return;
      }

      try {
        console.log(`🔄 [${currentDepartment.code}] Firebase에서 직원 데이터 로딩 중...`);
        const firebaseEmployees = await firebaseService.getEmployees(currentDepartment.code);

        if (firebaseEmployees && firebaseEmployees.length > 0) {
          console.log(`✅ [${currentDepartment.code}] Firebase에서 직원 ${firebaseEmployees.length}명 로드됨`);
          dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: firebaseEmployees });
          saveData('employees', firebaseEmployees);
        } else {
          console.log(`📭 [${currentDepartment.code}] Firebase에 직원 데이터 없음, 로컬 데이터 확인`);
          // Firebase에 데이터가 없으면 로컬 데이터 확인 및 복구
          const localEmployees = JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
          if (localEmployees.length > 0) {
            console.log(`💾 로컬에서 직원 ${localEmployees.length}명 발견, 복원 및 Firebase 업로드`);
            dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: localEmployees });
            // Firebase에 업로드 (복구)
            firebaseService.saveEmployees(currentDepartment.code, localEmployees);
          }
        }
      } catch (error) {
        console.error('Firebase 직원 데이터 로드 실패:', error);
        // Firebase 실패 시 로컬스토리지에서 복원
        const localEmployees = JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
        if (localEmployees.length > 0) {
          dispatch({ type: EMPLOYEE_ACTIONS.SET_EMPLOYEES, payload: localEmployees });
          console.log(`💾 로컬에서 직원 ${localEmployees.length}명 복원됨`);
        }
      }
    };

    loadEmployeesFromFirebase();
  }, [currentDepartment?.code, getStorageKey, saveData]);

  const value = {
    // State
    employees: state.employees,

    // Actions
    setEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,

    // Computed values
    getEmployeeById,
    getEmployeesByTeam,
    getTeams,
    getUsedColors,
    getAvailableColors,

    // Constants
    COLOR_PALETTE
  };

  return (
    <EmployeeDataContext.Provider value={value}>
      {children}
    </EmployeeDataContext.Provider>
  );
}

// Hook
export function useEmployeeData() {
  const context = useContext(EmployeeDataContext);
  if (!context) {
    throw new Error('useEmployeeData must be used within an EmployeeDataProvider');
  }
  return context;
}

export default EmployeeDataContext;
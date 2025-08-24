import React, { createContext, useContext, useReducer, useCallback } from 'react';

const FiltersContext = createContext();

// 필터 관련 액션들
const FILTER_ACTIONS = {
  SET_FILTERS: 'SET_FILTERS',
  SET_SELECTED_TEAMS: 'SET_SELECTED_TEAMS',
  SET_SELECTED_EMPLOYEES: 'SET_SELECTED_EMPLOYEES',
  SET_VACATION_TYPES: 'SET_VACATION_TYPES',
  RESET_FILTERS: 'RESET_FILTERS'
};

// 기본 휴가 타입들
const DEFAULT_VACATION_TYPES = ['연차', '오전', '오후', '특별', '병가', '업무'];

// 초기 상태
const initialState = {
  selectedTeams: [],
  selectedEmployees: [],
  vacationTypes: [...DEFAULT_VACATION_TYPES]
};

// 필터 리듀서
function filtersReducer(state, action) {
  switch (action.type) {
    case FILTER_ACTIONS.SET_FILTERS:
      return {
        ...state,
        ...action.payload
      };

    case FILTER_ACTIONS.SET_SELECTED_TEAMS:
      return {
        ...state,
        selectedTeams: action.payload
      };

    case FILTER_ACTIONS.SET_SELECTED_EMPLOYEES:
      return {
        ...state,
        selectedEmployees: action.payload
      };

    case FILTER_ACTIONS.SET_VACATION_TYPES:
      return {
        ...state,
        vacationTypes: action.payload
      };

    case FILTER_ACTIONS.RESET_FILTERS:
      return {
        ...initialState,
        vacationTypes: [...DEFAULT_VACATION_TYPES]
      };

    default:
      return state;
  }
}

// Filters Provider
export function FiltersProvider({ children }) {
  const [state, dispatch] = useReducer(filtersReducer, initialState);

  // Actions
  const setFilters = useCallback((filters) => {
    dispatch({ type: FILTER_ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const setSelectedTeams = useCallback((teams) => {
    dispatch({ type: FILTER_ACTIONS.SET_SELECTED_TEAMS, payload: teams });
  }, []);

  const setSelectedEmployees = useCallback((employees) => {
    dispatch({ type: FILTER_ACTIONS.SET_SELECTED_EMPLOYEES, payload: employees });
  }, []);

  const setVacationTypes = useCallback((types) => {
    dispatch({ type: FILTER_ACTIONS.SET_VACATION_TYPES, payload: types });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: FILTER_ACTIONS.RESET_FILTERS });
  }, []);

  const toggleTeam = useCallback((teamName) => {
    const currentTeams = state.selectedTeams;
    const newTeams = currentTeams.includes(teamName)
      ? currentTeams.filter(t => t !== teamName)
      : [...currentTeams, teamName];
    
    setSelectedTeams(newTeams);
  }, [state.selectedTeams, setSelectedTeams]);

  const toggleEmployee = useCallback((employeeId) => {
    const currentEmployees = state.selectedEmployees;
    const newEmployees = currentEmployees.includes(employeeId)
      ? currentEmployees.filter(id => id !== employeeId)
      : [...currentEmployees, employeeId];
    
    setSelectedEmployees(newEmployees);
  }, [state.selectedEmployees, setSelectedEmployees]);

  const toggleVacationType = useCallback((type) => {
    const currentTypes = state.vacationTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setVacationTypes(newTypes);
  }, [state.vacationTypes, setVacationTypes]);

  // 계산된 값들
  const isTeamSelected = useCallback((teamName) => {
    return state.selectedTeams.includes(teamName);
  }, [state.selectedTeams]);

  const isEmployeeSelected = useCallback((employeeId) => {
    return state.selectedEmployees.includes(employeeId);
  }, [state.selectedEmployees]);

  const isVacationTypeSelected = useCallback((type) => {
    return state.vacationTypes.includes(type);
  }, [state.vacationTypes]);

  const hasActiveFilters = useCallback(() => {
    return state.selectedTeams.length > 0 || 
           state.selectedEmployees.length > 0 ||
           state.vacationTypes.length !== DEFAULT_VACATION_TYPES.length ||
           !DEFAULT_VACATION_TYPES.every(type => state.vacationTypes.includes(type));
  }, [state.selectedTeams.length, state.selectedEmployees.length, state.vacationTypes]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (state.selectedTeams.length > 0) count++;
    if (state.selectedEmployees.length > 0) count++;
    if (state.vacationTypes.length !== DEFAULT_VACATION_TYPES.length ||
        !DEFAULT_VACATION_TYPES.every(type => state.vacationTypes.includes(type))) {
      count++;
    }
    return count;
  }, [state.selectedTeams.length, state.selectedEmployees.length, state.vacationTypes]);

  // 필터 적용 함수
  const shouldShowEmployee = useCallback((employee) => {
    // 팀 필터가 있으면 해당 팀만 표시
    if (state.selectedTeams.length > 0) {
      return state.selectedTeams.includes(employee.team);
    }
    // 직원 필터가 있으면 해당 직원만 표시
    if (state.selectedEmployees.length > 0) {
      return state.selectedEmployees.includes(employee.id);
    }
    return true;
  }, [state.selectedTeams, state.selectedEmployees]);

  const shouldShowVacation = useCallback((vacation) => {
    return state.vacationTypes.includes(vacation.type);
  }, [state.vacationTypes]);

  const value = {
    // State
    selectedTeams: state.selectedTeams,
    selectedEmployees: state.selectedEmployees,
    vacationTypes: state.vacationTypes,
    
    // Actions
    setFilters,
    setSelectedTeams,
    setSelectedEmployees,
    setVacationTypes,
    resetFilters,
    toggleTeam,
    toggleEmployee,
    toggleVacationType,
    
    // Computed values
    isTeamSelected,
    isEmployeeSelected,
    isVacationTypeSelected,
    hasActiveFilters,
    getActiveFiltersCount,
    shouldShowEmployee,
    shouldShowVacation,
    
    // Constants
    DEFAULT_VACATION_TYPES
  };

  return (
    <FiltersContext.Provider value={value}>
      {children}
    </FiltersContext.Provider>
  );
}

// Hook
export function useFilters() {
  const context = useContext(FiltersContext);
  if (!context) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}

export default FiltersContext;
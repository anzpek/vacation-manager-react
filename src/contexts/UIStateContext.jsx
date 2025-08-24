import React, { createContext, useContext, useReducer, useCallback } from 'react';

const UIStateContext = createContext();

// UI 상태 관련 액션들
const UI_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_MODAL: 'SET_MODAL',
  TOGGLE_MOBILE_FILTER: 'TOGGLE_MOBILE_FILTER',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_HOLIDAYS_LOADED: 'SET_HOLIDAYS_LOADED'
};

// 초기 상태
const initialState = {
  loading: false,
  error: null,
  selectedDate: null,
  activeModal: null,
  modalProps: null,
  previousModal: null,
  holidaysLoaded: false,
  mobileFilterOpen: false
};

// UI 상태 리듀서
function uiStateReducer(state, action) {
  switch (action.type) {
    case UI_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case UI_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case UI_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case UI_ACTIONS.SET_MODAL:
      return {
        ...state,
        previousModal: state.activeModal,
        activeModal: action.payload.type,
        modalProps: action.payload.modalProps || null,
        selectedDate: action.payload.date || state.selectedDate
      };

    case UI_ACTIONS.TOGGLE_MOBILE_FILTER:
      return {
        ...state,
        mobileFilterOpen: !state.mobileFilterOpen
      };

    case UI_ACTIONS.SET_SELECTED_DATE:
      return {
        ...state,
        selectedDate: action.payload
      };

    case UI_ACTIONS.SET_HOLIDAYS_LOADED:
      return {
        ...state,
        holidaysLoaded: action.payload
      };

    default:
      return state;
  }
}

// UIState Provider
export function UIStateProvider({ children }) {
  const [state, dispatch] = useReducer(uiStateReducer, initialState);

  // Actions
  const setLoading = useCallback((loading) => {
    dispatch({ type: UI_ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: UI_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: UI_ACTIONS.CLEAR_ERROR });
  }, []);

  const openModal = useCallback((modalType, data = {}) => {
    console.log('[UIStateContext] 🚀 openModal 호출됨:', {
      modalType,
      data,
      currentActiveModal: state.activeModal
    });
    
    try {
      // addVacation만 vacation으로 매핑, 나머지는 그대로 유지
      const mappedType = modalType === 'addVacation' ? 'vacation' : modalType;
      const payload = { 
        type: mappedType, 
        date: data.date ? new Date(data.date) : null,
        modalProps: {
          ...data  // 모든 데이터를 modalProps에 전달
        }
      };

      console.log('[UIStateContext] 📤 dispatch 페이로드:', payload);
      
      dispatch({ 
        type: UI_ACTIONS.SET_MODAL, 
        payload 
      });
      
      console.log('[UIStateContext] ✅ openModal 완료');
    } catch (error) {
      console.error('[UIStateContext] ❌ openModal 오류:', error);
    }
  }, [state.activeModal]);

  const setModal = useCallback((type, date = null) => {
    dispatch({ 
      type: UI_ACTIONS.SET_MODAL, 
      payload: { 
        type, 
        date,
        modalProps: null  // 모달을 닫을 때 modalProps 초기화
      } 
    });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ 
      type: UI_ACTIONS.SET_MODAL, 
      payload: { 
        type: null, 
        date: null,
        modalProps: null 
      } 
    });
  }, []);

  const toggleMobileFilter = useCallback(() => {
    dispatch({ type: UI_ACTIONS.TOGGLE_MOBILE_FILTER });
  }, []);

  const setSelectedDate = useCallback((date) => {
    dispatch({ type: UI_ACTIONS.SET_SELECTED_DATE, payload: date });
  }, []);

  const setHolidaysLoaded = useCallback((loaded) => {
    dispatch({ type: UI_ACTIONS.SET_HOLIDAYS_LOADED, payload: loaded });
  }, []);

  // 계산된 값들
  const isModalOpen = useCallback((modalType) => {
    return state.activeModal === modalType;
  }, [state.activeModal]);

  const hasError = useCallback(() => {
    return state.error !== null;
  }, [state.error]);

  const value = {
    // State
    loading: state.loading,
    error: state.error,
    selectedDate: state.selectedDate,
    activeModal: state.activeModal,
    modalProps: state.modalProps,
    previousModal: state.previousModal,
    holidaysLoaded: state.holidaysLoaded,
    mobileFilterOpen: state.mobileFilterOpen,
    
    // Actions
    setLoading,
    setError,
    clearError,
    openModal,
    setModal,
    closeModal,
    toggleMobileFilter,
    setSelectedDate,
    setHolidaysLoaded,
    
    // Computed values
    isModalOpen,
    hasError
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

// Hook
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}

export default UIStateContext;
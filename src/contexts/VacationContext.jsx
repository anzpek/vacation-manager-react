import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { fetchKoreanHolidays, preloadHolidays } from '../utils/holidayUtils';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import firebaseService from '../utils/firebaseService';

const VacationContext = createContext();

// 초기 상태
const initialState = {
  employees: [],
  departments: [],
  vacations: [],
  holidays: {}, // 공휴일 데이터
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth(),
  filters: {
    selectedTeams: [],
    selectedEmployees: [],
    vacationTypes: ['연차', '오전', '오후', '특별', '병가', '업무']
  },
  ui: {
    loading: false,
    error: null,
    selectedDate: null,
    activeModal: null,
    holidaysLoaded: false,
    mobileFilterOpen: false
  },
  firebase: {
    connected: false,
    syncing: false,
    lastSyncTime: null
  }
};

// 액션 타입
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  SET_VACATIONS: 'SET_VACATIONS',
  SET_DEPARTMENTS: 'SET_DEPARTMENTS',
  SET_HOLIDAYS: 'SET_HOLIDAYS',
  ADD_VACATION: 'ADD_VACATION',
  UPDATE_VACATION: 'UPDATE_VACATION',
  DELETE_VACATION: 'DELETE_VACATION',
  DELETE_VACATION_DAY: 'DELETE_VACATION_DAY',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SET_DATE: 'SET_DATE',
  SET_FILTERS: 'SET_FILTERS',
  SET_MODAL: 'SET_MODAL',
  TOGGLE_MOBILE_FILTER: 'TOGGLE_MOBILE_FILTER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FIREBASE_CONNECTION: 'SET_FIREBASE_CONNECTION',
  SET_FIREBASE_SYNCING: 'SET_FIREBASE_SYNCING',
  SET_LAST_SYNC_TIME: 'SET_LAST_SYNC_TIME'
};

// 리듀서
function vacationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload }
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        ui: { ...state.ui, error: action.payload }
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        ui: { ...state.ui, error: null }
      };

    case ACTIONS.SET_EMPLOYEES:
      return {
        ...state,
        employees: action.payload
      };

    case ACTIONS.SET_VACATIONS:
      return {
        ...state,
        vacations: action.payload
      };

    case ACTIONS.SET_DEPARTMENTS:
      return {
        ...state,
        departments: action.payload
      };

    case ACTIONS.SET_HOLIDAYS:
      return {
        ...state,
        holidays: action.payload,
        ui: { ...state.ui, holidaysLoaded: true }
      };

    case ACTIONS.ADD_VACATION:
      return {
        ...state,
        vacations: [...state.vacations, action.payload]
      };

    case ACTIONS.UPDATE_VACATION:
      return {
        ...state,
        vacations: state.vacations.map(v =>
          v.id === action.payload.id ? action.payload : v
        )
      };

    case ACTIONS.DELETE_VACATION:
      return {
        ...state,
        vacations: state.vacations.filter(v => v.id !== action.payload)
      };

    case ACTIONS.DELETE_VACATION_DAY:
      const { vacationId, date } = action.payload;
      return {
        ...state,
        vacations: state.vacations.filter(v => !(v.id === vacationId && v.date === date))
      };

    case ACTIONS.DELETE_CONSECUTIVE_VACATIONS:
      const { startDate, endDate, employeeId } = action.payload;
      return {
        ...state,
        vacations: state.vacations.filter(v => {
          const vacDate = new Date(v.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          return !(v.employeeId === employeeId && vacDate >= start && vacDate <= end);
        })
      };

    case ACTIONS.ADD_EMPLOYEE:
      return {
        ...state,
        employees: [...state.employees, action.payload]
      };

    case ACTIONS.UPDATE_EMPLOYEE:
      return {
        ...state,
        employees: state.employees.map(e =>
          e.id === action.payload.id ? action.payload : e
        )
      };

    case ACTIONS.DELETE_EMPLOYEE:
      const deletedEmployeeId = action.payload;
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== deletedEmployeeId),
        vacations: state.vacations.filter(v => v.employeeId !== deletedEmployeeId)
      };

    case ACTIONS.SET_DATE:
      return {
        ...state,
        selectedYear: action.payload.year,
        selectedMonth: action.payload.month
      };

    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };

    case ACTIONS.SET_MODAL:
      return {
        ...state,
        ui: { 
          ...state.ui, 
          activeModal: action.payload.type,
          selectedDate: action.payload.date || state.ui.selectedDate,
          modalProps: action.payload.modalProps || null // modalProps 저장
        }
      };

    case ACTIONS.TOGGLE_MOBILE_FILTER:
      return {
        ...state,
        ui: {
          ...state.ui,
          mobileFilterOpen: !state.ui.mobileFilterOpen
        }
      };

    case ACTIONS.SET_FIREBASE_CONNECTION:
      return {
        ...state,
        firebase: {
          ...state.firebase,
          connected: action.payload
        }
      };

    case ACTIONS.SET_FIREBASE_SYNCING:
      return {
        ...state,
        firebase: {
          ...state.firebase,
          syncing: action.payload
        }
      };

    case ACTIONS.SET_LAST_SYNC_TIME:
      return {
        ...state,
        firebase: {
          ...state.firebase,
          lastSyncTime: action.payload
        }
      };

    default:
      return state;
  }
}

export function VacationProvider({ children }) {
  const [state, dispatch] = useReducer(vacationReducer, initialState);
  const authContext = useAuth();
  
  // useNotification을 안전하게 호출 (NotificationProvider가 없으면 빈 함수 사용)
  let showSuccess, showError, showWarning;
  try {
    const notificationContext = useNotification();
    showSuccess = notificationContext.showSuccess;
    showError = notificationContext.showError;
    showWarning = notificationContext.showWarning;
  } catch (error) {
    // NotificationProvider가 없는 경우 빈 함수 사용
    showSuccess = () => {};
    showError = () => {};
    showWarning = () => {};
  }
  
  // Auth context가 로드되지 않은 경우 기본값 설정
  const { currentDepartment, getDepartmentStorageKey } = authContext || {};

  // 부서별 로컬스토리지 키 생성 (AuthContext 활용)
  const getStorageKey = useCallback((key) => {
    if (!currentDepartment || !getDepartmentStorageKey) {
      // 로그인하지 않은 경우 기본 키 사용
      return `vacation_default_${key}`;
    }
    return getDepartmentStorageKey(`vacation_${key}`);
  }, [currentDepartment, getDepartmentStorageKey]);

  // 백업 생성 함수 (state 의존성 제거)
  const createBackup = useCallback((customData = null) => {
    try {
      // 현재 localStorage에서 직접 읽어오기 (state 의존성 제거)
      const employees = customData?.employees || JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
      const departments = customData?.departments || JSON.parse(localStorage.getItem(getStorageKey('departments')) || '[]');
      const vacations = customData?.vacations || JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
      
      const backupData = {
        employees,
        departments,
        vacations,
        timestamp: new Date().toISOString(),
        department: currentDepartment?.name || 'default'
      };
      
      // 메인 백업과 순환 백업 (최대 5개) 저장
      const backupKey = getStorageKey('backup_main');
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // 순환 백업 (타임스탬프 기반)
      const timestamp = Date.now();
      const rotatingBackupKey = getStorageKey(`backup_${timestamp}`);
      localStorage.setItem(rotatingBackupKey, JSON.stringify(backupData));
      
      // 오래된 백업 정리 (5개 이상이면 가장 오래된 것 삭제)
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(getStorageKey('backup_')) && key !== backupKey)
        .sort();
      
      if (backupKeys.length > 5) {
        const toDelete = backupKeys.slice(0, backupKeys.length - 5);
        toDelete.forEach(key => localStorage.removeItem(key));
      }
      
      console.log('🔄 백업 생성 완료:', timestamp);
    } catch (error) {
      console.error('백업 생성 실패:', error);
    }
  }, [currentDepartment, getStorageKey]);

  // 백업 복원 함수
  const restoreFromBackup = useCallback(() => {
    try {
      const backupKey = getStorageKey('backup_main');
      const backupData = localStorage.getItem(backupKey);
      
      if (backupData) {
        const parsed = JSON.parse(backupData);
        console.log('🔄 백업에서 복원 중:', parsed.timestamp);
        
        dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: parsed.employees || [] });
        dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: parsed.departments || [] });
        dispatch({ type: ACTIONS.SET_VACATIONS, payload: parsed.vacations || [] });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('백업 복원 실패:', error);
      return false;
    }
  }, [getStorageKey, dispatch]);

  // 샘플 데이터 초기화
  const initializeSampleData = useCallback(async () => {
    const sampleDepartments = [
      { id: 1, name: '개발팀' },
      { id: 2, name: '마케팅팀' },
      { id: 3, name: '영업팀' }
    ];

    const sampleEmployees = [
      { id: 1, name: '김개발', team: '개발팀', position: 'member', color: '#3B82F6' },
      { id: 2, name: '이마케팅', team: '마케팅팀', position: 'leader', color: '#10B981' },
      { id: 3, name: '박영업', team: '영업팀', position: 'member', color: '#F59E0B' }
    ];

    // 샘플 휴가 데이터 (현재 달)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const sampleVacations = [
      {
        id: 1,
        employeeId: 1,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`,
        type: '연차'
      },
      {
        id: 2,
        employeeId: 2,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-16`,
        type: '오전'
      },
      {
        id: 3,
        employeeId: 3,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-17`,
        type: '연차'
      },
      {
        id: 4,
        employeeId: 1,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`,
        type: '오후'
      }
    ];

    // actions 객체가 아직 정의되지 않았을 수 있으므로, 직접 dispatch 사용
    dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: sampleDepartments });
    dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: sampleEmployees });
    dispatch({ type: ACTIONS.SET_VACATIONS, payload: sampleVacations });

    // 로컬 스토리지에 저장
    localStorage.setItem(getStorageKey('departments'), JSON.stringify(sampleDepartments));
    localStorage.setItem(getStorageKey('employees'), JSON.stringify(sampleEmployees));
    localStorage.setItem(getStorageKey('vacations'), JSON.stringify(sampleVacations));

  }, [dispatch, getStorageKey]);

  // 데이터 로드
  const loadData = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      let employees = [];
      let vacations = [];
      let departments = [];
      
      // Firebase 연결된 경우 Firebase에서 우선 로드
      if (state.firebase?.connected && currentDepartment) {
        console.log('🔥 Firebase에서 데이터 로드 시도...');
        try {
          const [firebaseEmployees, firebaseVacations] = await Promise.all([
            firebaseService.getEmployees(currentDepartment.code),
            firebaseService.getVacations(currentDepartment.code)
          ]);
          
          if (firebaseEmployees.length > 0 || firebaseVacations.length > 0) {
            employees = firebaseEmployees.map(e => ({
              ...e,
              id: typeof e.id === 'string' ? parseInt(e.id, 10) : e.id
            }));
            vacations = firebaseVacations.map(v => ({
              ...v,
              id: typeof v.id === 'string' ? parseInt(v.id, 10) : v.id,
              employeeId: typeof v.employeeId === 'string' ? parseInt(v.employeeId, 10) : v.employeeId
            }));
            
            console.log(`🔥 Firebase 데이터 로드 완료: 직원 ${employees.length}명, 휴가 ${vacations.length}개`);
            
            // Firebase 데이터를 localStorage에도 백업
            localStorage.setItem(getStorageKey('employees'), JSON.stringify(employees));
            localStorage.setItem(getStorageKey('vacations'), JSON.stringify(vacations));
          } else {
            console.log('🔥 Firebase에 데이터가 없음 - localStorage 사용');
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase 로드 실패 - localStorage 사용:', firebaseError);
        }
      }
      
      // Firebase에서 로드하지 못한 경우 localStorage에서 로드
      if (employees.length === 0 && vacations.length === 0) {
        console.log('💾 localStorage에서 데이터 로드...');
        employees = JSON.parse(
          localStorage.getItem(getStorageKey('employees')) || '[]'
        ).map(e => ({
          ...e,
          id: typeof e.id === 'string' ? parseInt(e.id, 10) : e.id
        }));
        vacations = JSON.parse(
          localStorage.getItem(getStorageKey('vacations')) || '[]'
        ).map(v => ({
          ...v,
          id: typeof v.id === 'string' ? parseInt(v.id, 10) : v.id,
          employeeId: typeof v.employeeId === 'string' ? parseInt(v.employeeId, 10) : v.employeeId
        }));
      }
      
      departments = JSON.parse(
        localStorage.getItem(getStorageKey('departments')) || '[]'
      );

      // 데이터 존재 여부 확인 - Firebase 우선, localStorage 보조, 마지막에 백업
      const hasAnyData = employees.length > 0 || vacations.length > 0 || departments.length > 0;
      
      if (!hasAnyData) {
        console.log('⚠️ 메인 데이터가 비어있음 - 백업에서 복원 시도');
        const restored = restoreFromBackup();
        
        if (!restored) {
          // 🔧 강력한 데이터 보존: 여러 키를 확인하여 기존 사용자 판별
          const preservationKeys = [
            'vacation_system_ever_initialized',
            'app_initialized', 
            getStorageKey('employees_ever_created'),
            getStorageKey('vacations_ever_created'),
            'user_data_exists'
          ];
          
          const hasAnyPreservationFlag = preservationKeys.some(key => 
            localStorage.getItem(key) || sessionStorage.getItem(key)
          );
          
          // 추가: Firebase 연결 상태에서 데이터 존재 여부도 확인
          let hasFirebaseData = false;
          if (currentDepartment) {
            try {
              const [fbEmployees, fbVacations] = await Promise.all([
                firebaseService.getEmployees(currentDepartment.code),
                firebaseService.getVacations(currentDepartment.code)
              ]);
              hasFirebaseData = fbEmployees.length > 0 || fbVacations.length > 0;
              if (hasFirebaseData) {
                console.log('🔥 Firebase에서 기존 사용자 데이터 발견 - 샘플 데이터 생성 건너뜀');
                // Firebase 데이터가 있으면 바로 로드
                dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: fbEmployees });
                dispatch({ type: ACTIONS.SET_VACATIONS, payload: fbVacations });
                // 보존 플래그 설정
                preservationKeys.forEach(key => {
                  localStorage.setItem(key, 'true');
                  sessionStorage.setItem(key, 'true');
                });
                return; // 조기 종료로 샘플 데이터 생성 방지
              }
            } catch (fbError) {
              console.log('⚠️ Firebase 데이터 확인 실패:', fbError);
            }
          }
          
          // Firebase 데이터도 없고 보존 플래그도 없을 때만 샘플 데이터 생성
          if (!hasAnyPreservationFlag && !hasFirebaseData) {
            console.log('🆕 완전한 최초 실행 - 샘플 데이터 생성');
            await initializeSampleData();
            // 여러 플래그로 기존 사용자임을 표시
            preservationKeys.forEach(key => {
              localStorage.setItem(key, 'true');
              sessionStorage.setItem(key, 'true');
            });
          } else {
            console.log('👤 기존 사용자 감지 - 빈 상태로 시작 (데이터 손실 방지)');
            console.log('💡 힌트: 데이터가 필요하면 사용자가 직접 입력하거나 백업을 복원하세요');
            dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: [] });
            dispatch({ type: ACTIONS.SET_VACATIONS, payload: [] });
            dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: [] });
          }
        }
      } else {
        console.log('✅ 데이터 로드 성공 - Firebase/localStorage에서 기존 데이터 발견');
        // 정상 데이터 로드
        dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: employees });
        dispatch({ type: ACTIONS.SET_VACATIONS, payload: vacations });
        dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: departments });
        
        // 기존 사용자 플래그들 설정 (데이터가 있다는 것은 이미 사용 중)
        const preservationKeys = [
          'vacation_system_ever_initialized',
          'app_initialized',
          getStorageKey('employees_ever_created'),
          getStorageKey('vacations_ever_created'),
          'user_data_exists'
        ];
        preservationKeys.forEach(key => {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, 'true');
            sessionStorage.setItem(key, 'true');
          }
        });
        
        // 성공적으로 로드된 경우 백업 생성
        setTimeout(() => createBackup(), 1000);
      }

      // 공휴일 데이터 로드
      await loadHolidays();
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: '데이터 로드 중 오류가 발생했습니다.' });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, [dispatch, getStorageKey, initializeSampleData, restoreFromBackup, state.firebase?.connected, currentDepartment]);

  // 공휴일 로드
  const loadHolidays = useCallback(async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear, currentYear + 1];
      
      // 여러 연도의 공휴일을 미리 로드
      const holidaysData = await preloadHolidays(years);
      
      // 현재 표시할 연도의 공휴일만 state에 저장
      const currentYearHolidays = holidaysData[state.selectedYear] || {};
      dispatch({ type: ACTIONS.SET_HOLIDAYS, payload: currentYearHolidays });
      
      // 캐시에 저장 (다른 연도로 이동할 때 사용)
      sessionStorage.setItem('holidaysCache', JSON.stringify(holidaysData));
    } catch (error) {
      console.error('공휴일 로드 실패:', error);
      // 실패해도 앱은 계속 작동하도록 함
    }
  }, [state.selectedYear]);

  // Firebase 연결 테스트 및 실시간 리스너 설정
  const setupFirebase = useCallback(async () => {
    if (!currentDepartment) {
      console.log('🔥 setupFirebase: currentDepartment가 없어서 스킵');
      return;
    }

    console.log(`🔥 Firebase 연결 시도 시작 - ${currentDepartment.name} (${currentDepartment.code})`);

    try {
      // Firebase 연결 테스트
      console.log('🔥 Firebase 연결 테스트 중...');
      const isConnected = await firebaseService.testConnection();
      console.log(`🔥 Firebase 연결 테스트 결과: ${isConnected}`);
      
      dispatch({ type: ACTIONS.SET_FIREBASE_CONNECTION, payload: isConnected });

      if (isConnected) {
        console.log(`🔥 Firebase 연결 성공! - ${currentDepartment.name}`);
        
        // 현재 localStorage 데이터를 Firebase에 동기화
        console.log('🔄 localStorage 데이터를 Firebase로 동기화 중...');
        const employees = JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
        const vacations = JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
        
        if (employees.length > 0) {
          await firebaseService.saveEmployees(currentDepartment.code, employees);
          console.log(`✅ 직원 데이터 Firebase 동기화 완료: ${employees.length}명`);
        }
        
        if (vacations.length > 0) {
          await firebaseService.saveVacations(currentDepartment.code, vacations);
          console.log(`✅ 휴가 데이터 Firebase 동기화 완료: ${vacations.length}개`);
        }
        
        // 직원 데이터 실시간 리스너
        const unsubscribeEmployees = firebaseService.subscribeToEmployees(
          currentDepartment.code,
          (employees) => {
            console.log(`🔄 [${currentDepartment.name}] 직원 데이터 실시간 업데이트: ${employees.length}명`);
            dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: employees });
            dispatch({ type: ACTIONS.SET_LAST_SYNC_TIME, payload: Date.now() });
            
            // Firebase에서 받은 데이터를 localStorage에도 저장
            localStorage.setItem(getStorageKey('employees'), JSON.stringify(employees));
          }
        );

        // 휴가 데이터 실시간 리스너
        const unsubscribeVacations = firebaseService.subscribeToVacations(
          currentDepartment.code,
          (vacations) => {
            console.log(`🔄 [${currentDepartment.name}] 휴가 데이터 실시간 업데이트: ${vacations.length}개`);
            dispatch({ type: ACTIONS.SET_VACATIONS, payload: vacations });
            dispatch({ type: ACTIONS.SET_LAST_SYNC_TIME, payload: Date.now() });
            
            // Firebase에서 받은 데이터를 localStorage에도 저장
            localStorage.setItem(getStorageKey('vacations'), JSON.stringify(vacations));
          }
        );

        console.log('🔄 Firebase 실시간 리스너 설정 완료');

        // 정리 함수 반환
        return () => {
          console.log('🧹 Firebase 리스너 정리');
          unsubscribeEmployees();
          unsubscribeVacations();
        };
      } else {
        console.warn('⚠️ Firebase 연결 실패 - 로컬 모드로 작동');
        // 로컬 데이터 로드
        await loadData();
      }
    } catch (error) {
      console.error('❌ Firebase 설정 실패:', error);
      dispatch({ type: ACTIONS.SET_FIREBASE_CONNECTION, payload: false });
      // 로컬 데이터 로드
      await loadData();
    }
  }, [currentDepartment, loadData, getStorageKey]);

  // 초기 데이터 로드 (부서가 변경될 때마다 새로운 데이터 로드)
  useEffect(() => {
    if (currentDepartment) {
      console.log(`🏢 ${currentDepartment.name} 데이터 로드 중...`);
      setupFirebase();
    }

    // 컴포넌트 언마운트 시 Firebase 리스너 정리
    return () => {
      firebaseService.cleanup();
    };
  }, [currentDepartment?.code, setupFirebase]);

  // 데이터 저장
  const saveData = async (key, data) => {
    try {
      // localStorage에 저장
      localStorage.setItem(getStorageKey(key), JSON.stringify(data));
      console.log(`💾 localStorage 저장 완료: ${key} (${Array.isArray(data) ? data.length : 'non-array'}개)`);
      
      // Firebase에도 동기화 (연결된 경우에만)
      if (state.firebase?.connected && currentDepartment) {
        try {
          let result;
          if (key === 'employees') {
            result = await firebaseService.saveEmployees(currentDepartment.code, data);
          } else if (key === 'vacations') {
            result = await firebaseService.saveVacations(currentDepartment.code, data);
          }
          
          if (result?.success) {
            console.log(`🔥 Firebase 저장 완료: ${key} (${Array.isArray(data) ? data.length : 'non-array'}개)`);
          } else {
            console.warn(`⚠️ Firebase 저장 실패: ${key}`, result?.error);
          }
        } catch (firebaseError) {
          console.warn(`⚠️ Firebase 저장 중 오류: ${key}`, firebaseError);
        }
      } else {
        console.log(`📱 Firebase 미연결 상태 - localStorage만 사용: ${key}`);
      }
    } catch (error) {
      console.error('데이터 저장 실패:', error);
    }
  };

  // 액션들
  const actions = {
    // 직원 관리
    setEmployees: (employees) => {
      dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: employees });
      saveData('employees', employees);
    },

    addEmployee: (employee) => {
      // 색상 팔레트 정의
      const colorPalette = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', // Blue, Green, Orange, Red, Purple
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1', // Cyan, Lime, Dark Orange, Pink, Indigo
        '#14B8A6', '#F43F5E', '#8B5A2B', '#6B7280', '#DC2626', // Teal, Rose, Brown, Gray, Dark Red
        '#7C3AED', '#059669', '#D97706', '#BE185D', '#4338CA', // Violet, Emerald, Amber, Ruby, Dark Blue
        '#A855F7', '#22D3EE', '#FACC15', '#FB7185', '#A78BFA', // Light Purple, Sky Blue, Yellow, Rose Pink, Light Indigo
        '#4ADE80', '#F472B6', '#6EE7B7', '#F87171', '#9CA3AF', // Light Green, Light Pink, Mint, Light Red, Dark Gray
        '#D946EF', '#34D399', '#FBBF24', '#FCA5A5', '#C4B5FD', // Magenta, Medium Green, Gold, Light Red, Lavender
        '#60A5FA', '#F0ABFC', '#A3E635', '#FDBA74', '#FDA4AF'  // Royal Blue, Light Purple, Chartreuse, Peach, Coral
      ];
      
      // 현재 직원들의 색상을 다시 가져오기
      const storageKey = getStorageKey('employees');
      const currentEmployees = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const usedColors = currentEmployees.map(emp => emp.color).filter(Boolean);
      
      // 사용되지 않은 색상 찾기
      const availableColors = colorPalette.filter(color => !usedColors.includes(color));
      
      // 색상 할당
      let assignedColor;
      if (employee.color && employee.color !== null) {
        assignedColor = employee.color;
      } else if (availableColors.length > 0) {
        assignedColor = availableColors[0];
      } else {
        assignedColor = colorPalette[currentEmployees.length % colorPalette.length];
      }
      
      const newEmployee = { 
        ...employee, 
        id: Date.now() + Math.floor(Math.random() * 1000), // 정수로 변경
        color: assignedColor
      };
      
      dispatch({ type: ACTIONS.ADD_EMPLOYEE, payload: newEmployee });
      
      const updatedEmployees = [...currentEmployees, newEmployee];
      saveData('employees', updatedEmployees);
      
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
    },

    updateEmployee: (employee) => {
      dispatch({ type: ACTIONS.UPDATE_EMPLOYEE, payload: employee });
      
      const updatedEmployees = state.employees.map(e =>
        e.id === employee.id ? employee : e
      );
      saveData('employees', updatedEmployees);
    },

    deleteEmployee: (employeeId) => {
      // 즉시 dispatch로 UI 업데이트
      dispatch({ type: ACTIONS.DELETE_EMPLOYEE, payload: employeeId });
      
      // localStorage에서도 제거
      const empStorageKey = getStorageKey('employees');
      const vacStorageKey = getStorageKey('vacations');
      const currentEmployees = JSON.parse(localStorage.getItem(empStorageKey) || '[]');
      const currentVacations = JSON.parse(localStorage.getItem(vacStorageKey) || '[]');
      
      const updatedEmployees = currentEmployees.filter(e => e.id !== employeeId);
      const updatedVacations = currentVacations.filter(v => v.employeeId !== employeeId);
      
      saveData('employees', updatedEmployees);
      saveData('vacations', updatedVacations);
      
      // 휴가 데이터도 함께 업데이트
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: updatedVacations });
    },

    // 휴가 관리
    setVacations: (vacations) => {
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: vacations });
      saveData('vacations', vacations);
    },

    addVacation: async (vacation) => {
      try {
        // 직원 존재 여부 검증 (localStorage에서 최신 데이터 확인)
        const currentEmployees = JSON.parse(localStorage.getItem(getStorageKey('employees')) || '[]');
        const employee = currentEmployees.find(emp => emp.id === parseInt(vacation.employeeId));
        if (!employee) {
          throw new Error(`존재하지 않는 직원입니다. ID: ${vacation.employeeId}`);
        }

        const newVacation = { 
          ...vacation, 
          employeeId: parseInt(vacation.employeeId),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // 🔧 중복 휴가 검증: 같은 날짜, 같은 직원의 휴가가 이미 있는지 확인
        const existingVacation = state.vacations.find(v => 
          v.employeeId === newVacation.employeeId && v.date === newVacation.date
        );
        
        if (existingVacation) {
          console.log(`[VacationContext] ⚠️ 중복 휴가 감지 - 기존 휴가 덮어쓰기:`, {
            existing: { id: existingVacation.id, type: existingVacation.type },
            new: { type: newVacation.type }
          });
          
          // localStorage에서 직접 확인하여 중복 처리
          const currentVacations = JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
          const storageExisting = currentVacations.find(v => v.id === existingVacation.id);
          
          if (storageExisting) {
            // 기존 휴가가 실제로 존재하면 업데이트
            return await actions.updateVacation({ ...newVacation, id: existingVacation.id });
          } else {
            // 기존 휴가가 localStorage에 없으면 기존 휴가를 삭제하고 새로 추가
            console.log(`[VacationContext] 🔧 기존 휴가가 localStorage에 없음, state에서 삭제 후 새로 추가`);
            const updatedVacations = state.vacations.filter(v => v.id !== existingVacation.id);
            dispatch({ type: ACTIONS.SET_VACATIONS, payload: updatedVacations });
            // 새 휴가로 계속 진행
          }
        }

        dispatch({ type: ACTIONS.SET_FIREBASE_SYNCING, payload: true });

        // Firebase 연결 상태 확인
        if (state.firebase.connected && currentDepartment) {
          // Firebase에 저장
          const result = await firebaseService.addVacation(currentDepartment.code, newVacation);
          
          if (result.success) {
            console.log(`✅ [${currentDepartment.name}] Firebase 휴가 추가 완료`);
            
            // 알림 표시
            showSuccess(
              '휴가 등록 완료',
              `${employee.name}님의 ${newVacation.type} 휴가가 등록되었습니다.`,
              {
                employee: employee,
                date: newVacation.date
              }
            );
            
            return result.vacation;
          } else {
            throw new Error(result.error?.message || 'Firebase 저장 실패');
          }
        } else {
          // 로컬 모드로 처리
          const localId = Date.now() + Math.floor(Math.random() * 10000);
          const localVacation = { ...newVacation, id: localId };
          
          dispatch({ type: ACTIONS.ADD_VACATION, payload: localVacation });
          saveData('vacations', [...state.vacations, localVacation]);
          
          // 사용자 데이터 생성 플래그 설정 (데이터 보존용)
          localStorage.setItem(getStorageKey('vacations_ever_created'), 'true');
          localStorage.setItem('user_data_exists', 'true');
          sessionStorage.setItem('user_data_exists', 'true');
          
          showSuccess(
            '휴가 등록 완료 (로컬)',
            `${employee.name}님의 ${newVacation.type} 휴가가 등록되었습니다.`,
            {
              employee: employee,
              date: newVacation.date
            }
          );
          
          return localVacation;
        }
      } catch (error) {
        console.error('휴가 추가 실패:', error);
        showError('휴가 등록 실패', error.message);
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_FIREBASE_SYNCING, payload: false });
      }
    },

    updateVacation: (vacation) => {
      console.log('[VacationContext] 🔄 updateVacation 시작:', vacation);
      
      // 직원 존재 여부 검증
      const employee = state.employees.find(emp => emp.id === parseInt(vacation.employeeId));
      if (!employee) {
        throw new Error(`존재하지 않는 직원입니다. ID: ${vacation.employeeId}`);
      }
      
      // localStorage에서 현재 휴가 데이터를 읽어옴
      const currentVacations = JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
      console.log('[VacationContext] 📊 수정 전 localStorage 휴가들:', currentVacations.length, '개');
      console.log('[VacationContext] 📋 수정 대상:', { id: vacation.id, 원래직원: currentVacations.find(v => v.id === vacation.id)?.employeeId, 새직원: vacation.employeeId });
      
      // 기존 휴가 정보 찾기
      const originalVacation = currentVacations.find(v => v.id === vacation.id);
      if (!originalVacation) {
        throw new Error(`존재하지 않는 휴가입니다. ID: ${vacation.id}`);
      }
      
      const updatedVacation = {
        ...vacation,
        employeeId: parseInt(vacation.employeeId) // 숫자로 강제 변환
      };
      
      // 🔧 핵심 수정: 직원이 변경된 경우 기존 휴가 삭제 후 새 휴가 추가
      let finalVacations;
      
      if (originalVacation.employeeId !== updatedVacation.employeeId) {
        console.log('[VacationContext] 🔄 직원 변경 감지 - 기존 휴가 삭제 후 새 휴가 추가');
        console.log('[VacationContext] 🗑️ 삭제할 기존 휴가:', { id: originalVacation.id, employeeId: originalVacation.employeeId, date: originalVacation.date, type: originalVacation.type });
        console.log('[VacationContext] ➕ 추가할 새 휴가:', { id: updatedVacation.id, employeeId: updatedVacation.employeeId, date: updatedVacation.date, type: updatedVacation.type });
        
        // 1단계: 기존 휴가 완전 삭제
        finalVacations = currentVacations.filter(v => v.id !== vacation.id);
        console.log('[VacationContext] 1단계 삭제 후 휴가 수:', finalVacations.length);
        
        // 2단계: 새 직원의 같은 날짜 기존 휴가가 있으면 제거
        const conflictingVacations = finalVacations.filter(v => 
          v.date === updatedVacation.date && 
          v.employeeId === updatedVacation.employeeId
        );
        
        if (conflictingVacations.length > 0) {
          console.log('[VacationContext] 🔄 새 직원의 기존 휴가와 충돌, 제거:', conflictingVacations.map(v => ({ id: v.id, date: v.date, type: v.type })));
          finalVacations = finalVacations.filter(v => 
            !conflictingVacations.some(cv => cv.id === v.id)
          );
        }
        
        // 3단계: 새 휴가 추가
        finalVacations.push(updatedVacation);
        console.log('[VacationContext] 2단계 새 휴가 추가 후 휴가 수:', finalVacations.length);
        
      } else {
        // 같은 직원 내에서의 수정: 기존 로직 사용
        console.log('[VacationContext] 📝 같은 직원 내 휴가 수정');
        finalVacations = currentVacations.map(v =>
          v.id === vacation.id ? updatedVacation : v
        );
        
        // 날짜가 변경된 경우 중복 검사
        if (originalVacation.date !== updatedVacation.date) {
          console.log('[VacationContext] 📅 날짜 변경 감지 - 중복 휴가 검사');
          
          const duplicates = finalVacations.filter(v => 
            v.id !== updatedVacation.id && 
            v.date === updatedVacation.date && 
            v.employeeId === updatedVacation.employeeId
          );
          
          if (duplicates.length > 0) {
            console.log('[VacationContext] 🔄 중복 휴가 발견, 제거:', duplicates.map(v => ({ id: v.id, date: v.date, type: v.type })));
            finalVacations = finalVacations.filter(v => 
              !duplicates.some(dup => dup.id === v.id)
            );
          }
        }
      }
      
      console.log('[VacationContext] 🔍 최종 휴가 처리 완료');
      console.log('[VacationContext] 📊 처리 전 휴가 수:', currentVacations.length);
      console.log('[VacationContext] 📊 처리 후 휴가 수:', finalVacations.length);
      
      console.log('[VacationContext] 🔍 수정 후 최종 휴가들:', finalVacations.map(v => ({ id: v.id, employeeId: v.employeeId, date: v.date, type: v.type })));
      
      // 🔧 최종 검증: 같은 날짜에 같은 직원의 중복 휴가가 있는지 확인
      const duplicateCheck = {};
      finalVacations.forEach(v => {
        const key = `${v.employeeId}-${v.date}`;
        if (duplicateCheck[key]) {
          console.log(`[VacationContext] ⚠️ 중복 휴가 발견! ${key}:`, { 
            existing: duplicateCheck[key], 
            duplicate: { id: v.id, type: v.type } 
          });
        } else {
          duplicateCheck[key] = { id: v.id, type: v.type };
        }
      });
      
      // localStorage에 직접 저장 (중복 제거 로직 단순화)
      saveData('vacations', finalVacations);
      
      // state를 localStorage 데이터로 완전히 동기화
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: finalVacations });
      
      console.log('[VacationContext] updateVacation 완료');
      
      // 알림 표시
      const updatedEmployee = state.employees.find(emp => emp.id === updatedVacation.employeeId);
      showSuccess(
        '휴가 수정 완료',
        `${updatedEmployee?.name || '직원'}님의 휴가 정보가 수정되었습니다.`,
        {
          employee: updatedEmployee,
          date: updatedVacation.date
        }
      );
      
      // 필터는 사용자가 설정한 대로 유지 - 자동으로 변경하지 않음
    },

    deleteVacation: (vacationId) => {
      console.log('[VacationContext] deleteVacation 시작:', vacationId, typeof vacationId);
      
      // localStorage에서 현재 데이터 읽기
      const currentVacations = JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
      console.log('[VacationContext] 삭제 전 휴가 수:', currentVacations.length);
      
      // 삭제할 휴가 정보 찾기 (알림용)
      const targetId = typeof vacationId === 'string' ? parseInt(vacationId, 10) : vacationId;
      const deletedVacation = currentVacations.find(v => {
        const vId = typeof v.id === 'string' ? parseInt(v.id, 10) : v.id;
        return vId === targetId;
      });
      
      // ID 타입 불일치를 고려한 필터링
      const updatedVacations = currentVacations.filter(v => {
        const vId = typeof v.id === 'string' ? parseInt(v.id, 10) : v.id;
        const targetId = typeof vacationId === 'string' ? parseInt(vacationId, 10) : vacationId;
        return vId !== targetId;
      });
      
      console.log('[VacationContext] 삭제 후 휴가 수:', updatedVacations.length);
      console.log('[VacationContext] 실제 삭제된 수:', currentVacations.length - updatedVacations.length);
      
      // localStorage 저장
      saveData('vacations', updatedVacations);
      
      // state 업데이트
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: updatedVacations });
      
      // 알림 표시
      if (deletedVacation) {
        const employee = state.employees.find(emp => emp.id === deletedVacation.employeeId);
        showWarning(
          '휴가 삭제 완료',
          `${employee?.name || '직원'}님의 ${deletedVacation.type} 휴가가 삭제되었습니다.`,
          {
            employee: employee,
            date: deletedVacation.date
          }
        );
      }
    },

    deleteVacationDay: (vacationId, date) => {
      console.log('[VacationContext] 🗑️ deleteVacationDay 시작:', { vacationId, date });
      
      // localStorage에서 현재 데이터 읽기
      const currentVacations = JSON.parse(localStorage.getItem(getStorageKey('vacations')) || '[]');
      console.log('[VacationContext] 📊 삭제 전 휴가 수:', currentVacations.length);
      
      // 삭제할 휴가 찾기 (ID로 정확한 휴가 특정)
      const targetVacation = currentVacations.find(v => v.id == vacationId);
      if (!targetVacation) {
        console.log('[VacationContext] ⚠️ 삭제할 휴가를 찾을 수 없음:', vacationId);
        return;
      }
      
      console.log('[VacationContext] 🎯 삭제할 휴가:', { 
        id: targetVacation.id, 
        employeeId: targetVacation.employeeId, 
        date: targetVacation.date, 
        type: targetVacation.type 
      });
      
      // 해당 ID의 휴가 삭제
      const updatedVacations = currentVacations.filter(v => v.id != vacationId);
      console.log('[VacationContext] 📊 삭제 후 휴가 수:', updatedVacations.length);
      console.log('[VacationContext] 📊 실제 삭제된 수:', currentVacations.length - updatedVacations.length);
      
      // localStorage 저장
      saveData('vacations', updatedVacations);
      
      // state 업데이트
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: updatedVacations });
      
      console.log('[VacationContext] ✅ deleteVacationDay 완료');
    },

    deleteConsecutiveVacations: (startDate, endDate, employeeId) => {
      dispatch({ type: ACTIONS.DELETE_CONSECUTIVE_VACATIONS, payload: { startDate, endDate, employeeId } });
      
      const vacationsAfterConsecutiveDelete = state.vacations.filter(v => {
        const vacDate = new Date(v.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return !(v.employeeId === employeeId && vacDate >= start && vacDate <= end);
      });
      saveData('vacations', vacationsAfterConsecutiveDelete);
    },

    // 부서 관리
    setDepartments: (departments) => {
      dispatch({ type: ACTIONS.SET_DEPARTMENTS, payload: departments });
      saveData('departments', departments);
      setTimeout(() => createBackup(), 100); // 백업 생성
    },

    // 날짜 관리
    setDate: (year, month) => {
      dispatch({ type: ACTIONS.SET_DATE, payload: { year, month } });
    },

    setSelectedDate: (year, month) => {
      dispatch({ type: ACTIONS.SET_DATE, payload: { year, month } });
    },

    // 필터 관리
    setFilters: (filters) => {
      dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
    },

    addBatchVacations: (vacations, newEmployees) => {
      // Add new employees
      const newEmployeeObjects = newEmployees.map(name => ({
        id: Date.now() + Math.floor(Math.random() * 1000), // 정수로 변경
        name,
        team: '기타', // default team
        position: 'member'
      }));
      const updatedEmployees = [...state.employees, ...newEmployeeObjects];
      dispatch({ type: ACTIONS.SET_EMPLOYEES, payload: updatedEmployees });
      saveData('employees', updatedEmployees);
      setTimeout(() => createBackup(), 100); // 백업 생성

      // Add vacations - 날짜 처리 수정
      const newVacations = vacations.map(v => {
        const employee = updatedEmployees.find(e => e.name === v.employeeName);
        
        // 날짜를 YYYY-MM-DD 형식으로 정확히 포맷팅
        let dateString;
        if (typeof v.date === 'string') {
          dateString = v.date;
        } else {
          // Date 객체인 경우 로컬 시간대 기준으로 포맷팅
          const year = v.date.getFullYear();
          const month = String(v.date.getMonth() + 1).padStart(2, '0');
          const day = String(v.date.getDate()).padStart(2, '0');
          dateString = `${year}-${month}-${day}`;
        }
        
        return {
          id: Date.now() + Math.floor(Math.random() * 1000), // 정수로 변경
          employeeId: employee.id,
          date: dateString,
          type: v.type
        };
      });
      const updatedVacations = [...state.vacations, ...newVacations];
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: updatedVacations });
      saveData('vacations', updatedVacations);
      setTimeout(() => createBackup(), 200); // 백업 생성 (더 중요한 데이터이므로 약간 지연)
    },

    // UI 관리
    openModal: (modalType, data = {}) => {
      console.log('[VacationContext] openModal received data:', data);
      dispatch({ 
        type: ACTIONS.SET_MODAL, 
        payload: { 
          type: modalType === 'addVacation' ? 'vacation' : modalType, 
          date: data.date ? new Date(data.date) : null,
          modalProps: { 
            ...(data.vacation && { vacation: data.vacation }),
            ...(data.employee && { employee: data.employee }),
            ...(data.consecutiveGroup && { consecutiveGroup: data.consecutiveGroup }) // consecutiveGroup 정보 추가
          }
        } 
      });
    },

    setModal: (type, date = null) => {
      dispatch({ type: ACTIONS.SET_MODAL, payload: { type, date } });
    },

    toggleFilter: () => {
      dispatch({ type: ACTIONS.TOGGLE_MOBILE_FILTER });
    },

    detectConflicts: (vacation) => {
      const conflicts = state.vacations.filter(v => {
        return v.id !== vacation.id &&
               v.employeeId === vacation.employeeId &&
               v.date === vacation.date;
      });
      
      console.log(`[VacationContext] 🔍 detectConflicts:`, {
        inputVacation: vacation,
        totalVacations: state.vacations.length,
        conflicts: conflicts.length,
        conflictDetails: conflicts.map(v => ({ id: v.id, date: v.date, type: v.type }))
      });
      
      return conflicts;
    },

    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    // 데이터 정리 및 검증 함수들
    cleanupOrphanedVacations: () => {
      const validEmployeeIds = state.employees.map(emp => emp.id);
      const cleanedVacations = state.vacations.filter(vacation => {
        const isValid = validEmployeeIds.includes(vacation.employeeId);
        if (!isValid) {
          console.log(`[DataCleanup] 고아 휴가 제거: ID ${vacation.id}, 직원ID ${vacation.employeeId}, 날짜 ${vacation.date}`);
        }
        return isValid;
      });

      const removedCount = state.vacations.length - cleanedVacations.length;
      
      if (removedCount > 0) {
        dispatch({ type: ACTIONS.SET_VACATIONS, payload: cleanedVacations });
        saveData('vacations', cleanedVacations);
        console.log(`[DataCleanup] ${removedCount}개의 고아 휴가가 제거되었습니다.`);
        return removedCount;
      }
      
      return 0;
    },

    performDataIntegrityCheck: () => {
      const issues = [];
      
      // 1. 고아 휴가 체크
      const validEmployeeIds = state.employees.map(emp => emp.id);
      const orphanedVacations = state.vacations.filter(v => !validEmployeeIds.includes(v.employeeId));
      if (orphanedVacations.length > 0) {
        issues.push(`고아 휴가 ${orphanedVacations.length}개 발견`);
      }

      // 2. ID 타입 불일치 체크
      const stringIdVacations = state.vacations.filter(v => typeof v.employeeId === 'string');
      if (stringIdVacations.length > 0) {
        issues.push(`문자열 ID 휴가 ${stringIdVacations.length}개 발견`);
      }

      // 3. 중복 휴가 체크
      const duplicates = [];
      const seen = new Map();
      state.vacations.forEach(vacation => {
        const key = `${vacation.employeeId}-${vacation.date}-${vacation.type}`;
        if (seen.has(key)) {
          duplicates.push(vacation);
        } else {
          seen.set(key, vacation);
        }
      });
      if (duplicates.length > 0) {
        issues.push(`중복 휴가 ${duplicates.length}개 발견`);
      }

      return {
        hasIssues: issues.length > 0,
        issues,
        orphanedVacations,
        stringIdVacations,
        duplicates
      };
    },

    performCompleteDataCleanup: () => {
      console.log('[DataCleanup] 전체 데이터 정리 시작...');
      
      let cleanedVacations = [...state.vacations];
      let cleanupReport = {
        orphanedRemoved: 0,
        duplicatesRemoved: 0,
        idTypesFixed: 0
      };

      // 1. ID 타입 정리 (string → number)
      cleanedVacations = cleanedVacations.map(v => ({
        ...v,
        id: typeof v.id === 'string' ? parseInt(v.id, 10) : v.id,
        employeeId: typeof v.employeeId === 'string' ? parseInt(v.employeeId, 10) : v.employeeId
      }));
      cleanupReport.idTypesFixed = state.vacations.filter(v => 
        typeof v.id === 'string' || typeof v.employeeId === 'string'
      ).length;

      // 2. 고아 휴가 제거
      const validEmployeeIds = state.employees.map(emp => emp.id);
      const beforeOrphanCleanup = cleanedVacations.length;
      cleanedVacations = cleanedVacations.filter(v => validEmployeeIds.includes(v.employeeId));
      cleanupReport.orphanedRemoved = beforeOrphanCleanup - cleanedVacations.length;

      // 3. 중복 휴가 제거
      const beforeDuplicateCleanup = cleanedVacations.length;
      const seen = new Map();
      cleanedVacations = cleanedVacations.filter(vacation => {
        const key = `${vacation.employeeId}-${vacation.date}-${vacation.type}`;
        if (seen.has(key)) {
          console.log(`[DataCleanup] 중복 휴가 제거: ${vacation.employeeId}-${vacation.date}-${vacation.type}`);
          return false;
        } else {
          seen.set(key, vacation);
          return true;
        }
      });
      cleanupReport.duplicatesRemoved = beforeDuplicateCleanup - cleanedVacations.length;

      // 4. 데이터 저장
      dispatch({ type: ACTIONS.SET_VACATIONS, payload: cleanedVacations });
      saveData('vacations', cleanedVacations);

      console.log('[DataCleanup] 정리 완료:', cleanupReport);
      return cleanupReport;
    },

    // 데이터 로드
    loadData
  };

  // 계산된 값들
  const computed = {
    // 필터링된 직원 목록
    getFilteredEmployees: () => {
      return state.employees.filter(employee => {
        if (state.filters.selectedTeams.length > 0) {
          return state.filters.selectedTeams.includes(employee.team);
        }
        if (state.filters.selectedEmployees.length > 0) {
          return state.filters.selectedEmployees.includes(employee.id);
        }
        return true;
      });
    },

    // 특정 날짜의 휴가 목록
    getVacationsByDate: (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return state.vacations.filter(v => v.date === dateStr);
    },

    // 특정 직원의 휴가 목록
    getVacationsByEmployee: (employeeId) => {
      return state.vacations.filter(v => v.employeeId === employeeId);
    },

    // 월별 휴가 통계
    getMonthlyStats: () => {
      const monthVacations = state.vacations.filter(v => {
        const vacDate = new Date(v.date);
        return vacDate.getFullYear() === state.selectedYear &&
               vacDate.getMonth() === state.selectedMonth;
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

export const useVacation = () => {
  const context = useContext(VacationContext);
  if (!context) {
    throw new Error('useVacation must be used within a VacationProvider');
  }
  return context;
};

export default VacationContext;
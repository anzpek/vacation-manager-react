// types/index.ts - 프로젝트 전체에서 사용되는 타입 정의

import { VacationType, PositionType } from '../utils/constants';

// 기본 ID 타입
export type ID = number | string;

// 직원 관련 타입
export interface Employee {
  id: ID;
  name: string;
  team: string;
  position: PositionType;
  color?: string;
  createdAt?: number;
  updatedAt?: number;
}

// 휴가 관련 타입
export interface Vacation {
  id: ID;
  employeeId: ID;
  employeeName?: string;
  date: string; // YYYY-MM-DD 형식
  type: VacationType;
  createdAt?: number;
  updatedAt?: number;
}

// 부서 관련 타입
export interface Department {
  id: ID;
  name: string;
  code: string;
  password?: string;
  createdAt?: number;
  updatedAt?: number;
}

// 필터 관련 타입
export interface Filters {
  selectedTeams: string[];
  selectedEmployees: ID[];
  vacationTypes: VacationType[];
}

// UI 상태 타입
export interface UIState {
  loading: boolean;
  error: string | null;
  selectedDate: Date | null;
  activeModal: string | null;
  modalProps: any;
  previousModal: string | null;
  holidaysLoaded: boolean;
  mobileFilterOpen: boolean;
}

// Firebase 상태 타입
export interface FirebaseState {
  connected: boolean;
  syncing: boolean;
  lastSyncTime: string | null;
}

// 통합 애플리케이션 상태 타입
export interface AppState {
  employees: Employee[];
  departments: Department[];
  vacations: Vacation[];
  selectedYear: number;
  selectedMonth: number;
  holidays: Record<string, string>;
  filters: Filters;
  ui: UIState;
  firebase: FirebaseState;
}

// Context Actions 타입
export interface VacationActions {
  // 직원 관리
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: ID) => { deletedVacationsCount: number };
  
  // 휴가 관리
  setVacations: (vacations: Vacation[]) => void;
  addVacation: (vacation: Omit<Vacation, 'id'>) => Promise<Vacation>;
  updateVacation: (vacation: Vacation) => Promise<void>;
  deleteVacation: (vacationId: ID) => void;
  deleteVacationDay: (vacationId: ID, date: string) => void;
  deleteConsecutiveVacations: (startDate: string, endDate: string, employeeId: ID) => void;
  
  // UI 관리
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  openModal: (modalType: string, data?: any) => void;
  setModal: (type: string | null, date?: Date | null) => void;
  closeModal: () => void;
  toggleMobileFilter: () => void;
  setSelectedDate: (date: Date | null) => void;
  setHolidaysLoaded: (loaded: boolean) => void;
  
  // 필터 관리
  setFilters: (filters: Partial<Filters>) => void;
  setSelectedTeams: (teams: string[]) => void;
  setSelectedEmployees: (employees: ID[]) => void;
  setVacationTypes: (types: VacationType[]) => void;
  resetFilters: () => void;
  toggleTeam: (teamName: string) => void;
  toggleEmployee: (employeeId: ID) => void;
  toggleVacationType: (type: VacationType) => void;
  
  // Firebase 관리
  setFirebaseConnection: (connected: boolean) => void;
  setFirebaseSyncing: (syncing: boolean) => void;
  setLastSyncTime: (syncTime: string | Date | null) => void;
  
  // 날짜 관리
  setDate: (year: number, month: number) => void;
  setDateByYearMonth: (year: number, month: number) => void;
  setHolidays: (holidays: Record<string, string>) => void;
  
  // 배치 작업
  addBatchVacations: (vacations: Omit<Vacation, 'id' | 'employeeId'>[], newEmployees: string[]) => void;
  
  // 데이터 정리
  cleanupOrphanedVacations: () => number;
  detectConflicts: (vacation: Vacation) => Vacation[];
}

// Computed Values 타입
export interface ComputedValues {
  filteredEmployees: () => Employee[];
  getVacationsByDate: (date: string | Date) => Vacation[];
  getVacationsByEmployee: (employeeId: ID) => Vacation[];
  getMonthlyStats: () => {
    total: number;
    byType: Record<string, number>;
    byEmployee: Record<string, number>;
  };
  getMonthlyVacations: (year: number, month: number) => Vacation[];
}

// Context Value 타입
export interface VacationContextValue {
  state: AppState;
  actions: VacationActions;
  computed: ComputedValues;
  currentDepartment: Department | null;
}

// 컴포넌트 Props 타입들
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface EmployeeManagerProps extends ModalProps {}

export interface VacationModalProps extends ModalProps {
  selectedDate?: Date | null;
  vacation?: Vacation | null;
}

export interface CalendarProps {
  year: number;
  month: number;
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
}

// API Response 타입들
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// 이벤트 핸들러 타입들
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeHandler = EventHandler<React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>>;
export type ClickHandler = EventHandler<React.MouseEvent<HTMLElement>>;
export type FormHandler = EventHandler<React.FormEvent<HTMLFormElement>>;
// Position hierarchy constants for consistent ordering
export const POSITION_ORDER: Record<string, number> = {
  'manager': 0,    // 부장
  'leader': 1,     // 팀장  
  'member': 2      // 팀원
} as const;

export const DEFAULT_POSITION_ORDER = 3;

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 768;

// Throttle delays for performance optimization
export const RESIZE_THROTTLE_DELAY = 100;
export const SEARCH_DEBOUNCE_DELAY = 300;

// Common vacation types
export const VACATION_TYPES = {
  ANNUAL: '연차',
  MORNING: '오전',
  AFTERNOON: '오후', 
  SPECIAL: '특별',
  SICK: '병가',
  BUSINESS: '업무'
} as const;

// Position display names
export const POSITION_NAMES: Record<string, string> = {
  'manager': '부장',
  'leader': '팀장',
  'member': '팀원'
} as const;

// Types for better type safety
export type PositionType = keyof typeof POSITION_ORDER;
export type VacationType = typeof VACATION_TYPES[keyof typeof VACATION_TYPES];

// Common component props validation patterns (deprecated - replaced with TypeScript types)
export const PROP_TYPES = {
  EMPLOYEE_ID: 'string',
  TEAM_ID: 'string',
  IS_OPEN: 'boolean',
  ON_CLOSE: 'function'
} as const;
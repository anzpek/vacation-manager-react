// holidayUtils.js - 대한민국 공휴일 API 연동
import { format } from 'date-fns';

/**
 * 대한민국 공휴일 정보를 가져오는 함수
 * https://holidays.dist.be API 사용 (무료, API 키 불필요)
 */
export const fetchKoreanHolidays = async (year) => {
  try {
    const response = await fetch(`https://holidays.dist.be/${year}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch holidays: ${response.status}`);
    }
    
    const holidays = await response.json();
    
    // 공휴일만 필터링 (holiday: true)
    const publicHolidays = holidays.filter(holiday => holiday.holiday);
    
    // 날짜를 키로 하는 객체로 변환
    const holidayMap = {};
    publicHolidays.forEach(holiday => {
      holidayMap[holiday.date] = {
        name: holiday.name,
        kind: holiday.kind,
        remarks: holiday.remarks
      };
    });
    
    return holidayMap;
  } catch (error) {
    console.error('공휴일 정보를 가져오는데 실패했습니다:', error);
    return getFallbackHolidays(year);
  }
};

/**
 * API 실패 시 사용할 기본 공휴일 데이터
 * 2025년 주요 공휴일들
 */
const getFallbackHolidays = (year) => {
  const fallbackHolidays = {
    2025: {
      '2025-01-01': { name: '신정', kind: 1 },
      '2025-01-28': { name: '설날 연휴', kind: 1 },
      '2025-01-29': { name: '설날', kind: 1 },
      '2025-01-30': { name: '설날 연휴', kind: 1 },
      '2025-03-01': { name: '삼일절', kind: 1 },
      '2025-05-05': { name: '어린이날', kind: 1 },
      '2025-05-06': { name: '대체공휴일', kind: 1 },
      '2025-06-06': { name: '현충일', kind: 1 },
      '2025-08-15': { name: '광복절', kind: 1 },
      '2025-10-03': { name: '개천절', kind: 1 },
      '2025-10-05': { name: '추석 연휴', kind: 1 },
      '2025-10-06': { name: '추석', kind: 1 },
      '2025-10-07': { name: '추석 연휴', kind: 1 },
      '2025-10-08': { name: '대체공휴일', kind: 1 },
      '2025-10-09': { name: '한글날', kind: 1 },
      '2025-12-25': { name: '크리스마스', kind: 1 }
    }
  };
  
  return fallbackHolidays[year] || {};
};

/**
 * 특정 날짜가 공휴일인지 확인
 */
export const isHoliday = (date, holidays) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return holidays[dateString] !== undefined;
};

/**
 * 특정 날짜의 공휴일 이름 가져오기
 */
export const getHolidayName = (date, holidays) => {
  const dateString = format(date, 'yyyy-MM-dd');
  return holidays[dateString]?.name || null;
};

/**
 * 주말 확인 (토요일, 일요일)
 */
export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0: 일요일, 6: 토요일
};

/**
 * 공휴일 또는 주말인지 확인
 */
export const isNonWorkingDay = (date, holidays) => {
  return isWeekend(date) || isHoliday(date, holidays);
};

/**
 * 여러 연도의 공휴일을 미리 로드하는 함수
 */
export const preloadHolidays = async (years) => {
  const holidaysCache = {};
  
  for (const year of years) {
    try {
      holidaysCache[year] = await fetchKoreanHolidays(year);
    } catch (error) {
      console.error(`${year}년 공휴일 로드 실패:`, error);
      holidaysCache[year] = getFallbackHolidays(year);
    }
  }
  
  return holidaysCache;
};

/**
 * 공휴일 스타일 클래스 반환
 */
export const getHolidayClass = (date, holidays) => {
  if (isHoliday(date, holidays)) {
    return 'holiday';
  }
  if (isWeekend(date)) {
    return 'weekend';
  }
  return '';
};

export default {
  fetchKoreanHolidays,
  isHoliday,
  getHolidayName,
  isWeekend,
  isNonWorkingDay,
  preloadHolidays,
  getHolidayClass
};
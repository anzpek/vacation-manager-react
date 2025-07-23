// dateUtils.js - 날짜 관련 유틸리티 함수들 (React 버전)
import { format, parseISO, isWeekend, addDays, subDays, startOfMonth, endOfMonth, 
         getDay, getDaysInMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

// YYYY-MM-DD 형식의 문자열을 Date 객체로 파싱
export const parseDateString = (dateString) => {
    return parseISO(dateString);
};

// Date 객체를 YYYY-MM-DD 형식의 문자열로 포맷팅
export const formatDateToYYYYMMDD = (date) => {
    return format(date, 'yyyy-MM-dd');
};

// 날짜를 한국어 형식으로 포맷팅
export const formatDateToKorean = (date) => {
    if (!date) return '';
    
    // 문자열인 경우 Date 객체로 변환
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // 유효하지 않은 날짜인 경우 빈 문자열 반환
    if (isNaN(date.getTime())) {
        console.warn('formatDateToKorean: Invalid date provided', date);
        return '';
    }
    
    return format(date, 'yyyy년 M월 d일', { locale: ko });
};

// 주말인지 확인
export const isWeekendDay = (date) => {
    return isWeekend(date);
};

// 요일 숫자 반환 (0: 일요일, 1: 월요일, ...)
export const getDayOfWeek = (date) => {
    return getDay(date);
};

// 월의 첫째 날
export const getFirstDayOfMonth = (year, month) => {
    return startOfMonth(new Date(year, month, 1));
};

// 월의 마지막 날
export const getLastDayOfMonth = (year, month) => {
    return endOfMonth(new Date(year, month, 1));
};

// 월의 총 일수
export const getDaysInMonthCount = (year, month) => {
    return getDaysInMonth(new Date(year, month, 1));
};

// 달력 표시를 위한 날짜 배열 생성 (이전/다음 월 포함)
export const getCalendarDays = (year, month) => {
    const firstDay = getFirstDayOfMonth(year, month);
    const lastDay = getLastDayOfMonth(year, month);
    
    // 첫 주의 시작일 (이전 월 포함)
    const startDay = startOfWeek(firstDay, { weekStartsOn: 0 }); // 일요일 시작
    
    // 마지막 주의 종료일 (다음 월 포함)
    const endDay = endOfWeek(lastDay, { weekStartsOn: 0 });
    
    const days = [];
    let currentDay = startDay;
    
    while (currentDay <= endDay) {
        days.push(new Date(currentDay));
        currentDay = addDays(currentDay, 1);
    }
    
    return days;
};

// 두 날짜가 같은 날인지 확인
export const isSameDay = (date1, date2) => {
    return formatDateToYYYYMMDD(date1) === formatDateToYYYYMMDD(date2);
};

// 오늘 날짜인지 확인
export const isToday = (date) => {
    return isSameDay(date, new Date());
};

// 같은 월인지 확인
export const isSameMonth = (date, year, month) => {
    return date.getFullYear() === year && date.getMonth() === month;
};

// 월 이름 반환
export const getMonthName = (month) => {
    const monthNames = [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    return monthNames[month];
};

// 요일 이름 반환
export const getDayName = (dayOfWeek) => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return dayNames[dayOfWeek];
};

// 연속된 날짜인지 확인
export const isConsecutiveDay = (date1, date2) => {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return diff === oneDayInMs;
};

// 대한민국 공휴일 데이터 (2025년)
const HOLIDAYS_2025 = {
    '2025-01-01': '신정',
    '2025-01-28': '설날 연휴',
    '2025-01-29': '설날',
    '2025-01-30': '설날 연휴',
    '2025-03-01': '삼일절',
    '2025-03-03': '삼일절 대체공휴일',
    '2025-05-05': '어린이날·부처님오신날',
    '2025-05-06': '어린이날·부처님오신날 대체공휴일',
    '2025-06-06': '현충일',
    '2025-08-15': '광복절',
    '2025-10-03': '개천절',
    '2025-10-05': '추석 연휴',
    '2025-10-06': '추석',
    '2025-10-07': '추석 연휴',
    '2025-10-08': '추석 대체공휴일',
    '2025-10-09': '한글날',
    '2025-12-25': '성탄절'
};

// 공휴일인지 확인
export const isHoliday = (date) => {
    const dateString = formatDateToYYYYMMDD(date);
    return !!HOLIDAYS_2025[dateString];
};

// 공휴일 이름 반환
export const getHolidayName = (date) => {
    const dateString = formatDateToYYYYMMDD(date);
    return HOLIDAYS_2025[dateString] || null;
};

// 휴일(주말 + 공휴일)인지 확인
export const isRestDay = (date) => {
    return isWeekendDay(date) || isHoliday(date);
};

// 영업일인지 확인
export const isWorkingDay = (date) => {
    return !isRestDay(date);
};

// 다음 영업일 찾기
export const getNextWorkingDay = (date) => {
    let nextDay = addDays(date, 1);
    while (!isWorkingDay(nextDay)) {
        nextDay = addDays(nextDay, 1);
    }
    return nextDay;
};

// 이전 영업일 찾기
export const getPreviousWorkingDay = (date) => {
    let prevDay = subDays(date, 1);
    while (!isWorkingDay(prevDay)) {
        prevDay = subDays(prevDay, 1);
    }
    return prevDay;
};

// 두 날짜 사이의 영업일 수 계산
export const getWorkingDaysBetween = (startDate, endDate) => {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        if (isWorkingDay(currentDate)) {
            count++;
        }
        currentDate = addDays(currentDate, 1);
    }
    
    return count;
};

// 날짜 범위 내의 모든 날짜 배열 반환
export const getDateRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate = addDays(currentDate, 1);
    }
    
    return dates;
};

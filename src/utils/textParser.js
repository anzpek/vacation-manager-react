// textParser.js - 다양한 형식의 텍스트를 휴가 데이터로 파싱하는 유틸리티

/**
 * 텍스트를 파싱하여 휴가 데이터로 변환
 * @param {string} text - 파싱할 텍스트
 * @param {Array} employees - 직원 목록
 * @returns {Array} 파싱 결과 배열
 */
export const parseVacationText = (text, employees) => {
    if (!text || !text.trim()) return [];
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    const results = [];
    
    lines.forEach((line, index) => {
        const result = parseLine(line.trim(), employees, index + 1);
        if (result.isRange && Array.isArray(result.vacation)) {
            // 기간 형식인 경우 각 날짜를 개별 결과로 추가
            result.vacation.forEach((vacation, i) => {
                results.push({
                    ...result,
                    vacation,
                    isRange: false,
                    rangeIndex: i
                });
            });
        } else {
            results.push(result);
        }
    });
    
    return results;
};

/**
 * 한 줄을 파싱하여 휴가 데이터로 변환
 * @param {string} line - 파싱할 줄
 * @param {Array} employees - 직원 목록
 * @param {number} lineNumber - 줄 번호
 * @returns {Object} 파싱 결과 객체
 */
const parseLine = (line, employees, lineNumber) => {
    try {
        // 빈 줄 처리
        if (!line || line.trim() === '') {
            return {
                isValid: false,
                error: '빈 줄입니다.',
                lineNumber,
                originalText: line
            };
        }
        
        // 주석 처리된 줄 (# 또는 // 로 시작)
        if (line.startsWith('#') || line.startsWith('//')) {
            return {
                isValid: false,
                error: '주석 줄입니다.',
                lineNumber,
                originalText: line
            };
        }
        
        // 다양한 형식으로 파싱 시도
        let parseResult = null;
        
        // 1. 표준 형식: 2025-07-15 김철수 연차 [설명]
        parseResult = parseStandardFormat(line, employees);
        if (parseResult.isValid) {
            return { ...parseResult, lineNumber, originalText: line };
        }
        
        // 2. 기간 형식: 2025-07-15~2025-07-17 김철수 연차 [설명]
        parseResult = parseDateRangeFormat(line, employees);
        if (parseResult.isValid) {
            return { ...parseResult, lineNumber, originalText: line };
        }
        
        // 3. 자연어 형식: 김철수 내일 연차, 박영희 다음주 월요일 오전반차
        parseResult = parseNaturalLanguageFormat(line, employees);
        if (parseResult.isValid) {
            return { ...parseResult, lineNumber, originalText: line };
        }
        
        // 4. CSV 형식: 2025-07-15,김철수,연차,설명
        parseResult = parseCsvFormat(line, employees);
        if (parseResult.isValid) {
            return { ...parseResult, lineNumber, originalText: line };
        }
        
        // 5. JSON 형식: {"date":"2025-07-15","employee":"김철수","type":"연차"}
        parseResult = parseJsonFormat(line, employees);
        if (parseResult.isValid) {
            return { ...parseResult, lineNumber, originalText: line };
        }
        
        return {
            isValid: false,
            error: '지원하지 않는 형식입니다.',
            lineNumber,
            originalText: line
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: `파싱 오류: ${error.message}`,
            lineNumber,
            originalText: line
        };
    }
};

/**
 * 표준 형식 파싱: 2025-07-15 김철수 연차 [설명]
 */
const parseStandardFormat = (line, employees) => {
    const parts = line.split(/\s+/);
    
    if (parts.length < 3) {
        return { isValid: false, error: '최소 3개 항목이 필요합니다 (날짜, 이름, 유형)' };
    }
    
    const dateStr = parts[0];
    const employeeName = parts[1];
    const vacationType = parts[2];
    const description = parts.slice(3).join(' ');
    
    // 날짜 유효성 검사
    const dateValidation = validateDate(dateStr);
    if (!dateValidation.isValid) {
        return { isValid: false, error: dateValidation.error };
    }
    
    // 직원 유효성 검사
    const employeeValidation = validateEmployee(employeeName, employees);
    if (!employeeValidation.isValid) {
        return { isValid: false, error: employeeValidation.error };
    }
    
    // 휴가 유형 유효성 검사
    const typeValidation = validateVacationType(vacationType);
    if (!typeValidation.isValid) {
        return { isValid: false, error: typeValidation.error };
    }
    
    return {
        isValid: true,
        vacation: {
            date: dateValidation.date,
            employee: employeeName,
            type: typeValidation.type,
            description: description || ''
        }
    };
};

/**
 * 기간 형식 파싱: 2025-07-15~2025-07-17 김철수 연차 [설명]
 */
const parseDateRangeFormat = (line, employees) => {
    const rangeMatch = line.match(/^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})\s+(.+)$/);
    if (!rangeMatch) {
        return { isValid: false, error: '기간 형식이 올바르지 않습니다' };
    }
    
    const startDate = rangeMatch[1];
    const endDate = rangeMatch[2];
    const remainingText = rangeMatch[3];
    
    const parts = remainingText.split(/\s+/);
    if (parts.length < 2) {
        return { isValid: false, error: '직원명과 휴가 유형이 필요합니다' };
    }
    
    const employeeName = parts[0];
    const vacationType = parts[1];
    const description = parts.slice(2).join(' ');
    
    // 시작일과 종료일 검증
    const startValidation = validateDate(startDate);
    const endValidation = validateDate(endDate);
    
    if (!startValidation.isValid) {
        return { isValid: false, error: `시작일 오류: ${startValidation.error}` };
    }
    
    if (!endValidation.isValid) {
        return { isValid: false, error: `종료일 오류: ${endValidation.error}` };
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        return { isValid: false, error: '시작일이 종료일보다 늦습니다' };
    }
    
    // 직원 및 휴가 유형 검증
    const employeeValidation = validateEmployee(employeeName, employees);
    if (!employeeValidation.isValid) {
        return { isValid: false, error: employeeValidation.error };
    }
    
    const typeValidation = validateVacationType(vacationType);
    if (!typeValidation.isValid) {
        return { isValid: false, error: typeValidation.error };
    }
    
    // 날짜 범위를 개별 날짜로 변환
    const vacations = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        vacations.push({
            date: dateStr,
            employee: employeeName,
            type: typeValidation.type,
            description: description || ''
        });
        current.setDate(current.getDate() + 1);
    }
    
    return {
        isValid: true,
        vacation: vacations,
        isRange: true
    };
};

/**
 * 자연어 형식 파싱: 김철수 내일 연차, 박영희 다음주 월요일 오전반차
 */
const parseNaturalLanguageFormat = (line, employees) => {
    // 자연어 날짜 패턴
    const naturalDatePatterns = [
        { pattern: /오늘/, offset: 0 },
        { pattern: /내일/, offset: 1 },
        { pattern: /모레/, offset: 2 },
        { pattern: /다음주\s*월요일/, offset: getNextWeekday(1) },
        { pattern: /다음주\s*화요일/, offset: getNextWeekday(2) },
        { pattern: /다음주\s*수요일/, offset: getNextWeekday(3) },
        { pattern: /다음주\s*목요일/, offset: getNextWeekday(4) },
        { pattern: /다음주\s*금요일/, offset: getNextWeekday(5) },
        { pattern: /월요일/, offset: getThisWeekday(1) },
        { pattern: /화요일/, offset: getThisWeekday(2) },
        { pattern: /수요일/, offset: getThisWeekday(3) },
        { pattern: /목요일/, offset: getThisWeekday(4) },
        { pattern: /금요일/, offset: getThisWeekday(5) }
    ];
    
    // 직원명 찾기
    const employeeNames = employees.map(emp => emp.name);
    const foundEmployee = employeeNames.find(name => line.includes(name));
    
    if (!foundEmployee) {
        return { isValid: false, error: '직원명을 찾을 수 없습니다' };
    }
    
    // 자연어 날짜 찾기
    let foundDate = null;
    let dateOffset = null;
    
    for (const pattern of naturalDatePatterns) {
        if (pattern.pattern.test(line)) {
            dateOffset = pattern.offset;
            break;
        }
    }
    
    if (dateOffset === null) {
        return { isValid: false, error: '날짜 표현을 찾을 수 없습니다' };
    }
    
    // 오늘 날짜 기준으로 계산 - 로컬 시간대 기준으로 수정
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dateOffset);
    
    // 로컬 시간대 기준으로 YYYY-MM-DD 형식 생성
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    foundDate = `${year}-${month}-${day}`;
    
    // 휴가 유형 찾기
    const vacationTypes = ['연차', '오전', '오후', '특별', '병가', '업무'];
    const foundType = vacationTypes.find(type => line.includes(type));
    
    if (!foundType) {
        return { isValid: false, error: '휴가 유형을 찾을 수 없습니다' };
    }
    
    // 설명 추출 (선택사항)
    const description = line.replace(foundEmployee, '').replace(foundType, '').replace(/오늘|내일|모레|다음주\s*\w요일|\w요일/g, '').trim();
    
    return {
        isValid: true,
        vacation: {
            date: foundDate,
            employee: foundEmployee,
            type: foundType,
            description: description || ''
        }
    };
};

/**
 * CSV 형식 파싱: 2025-07-15,김철수,연차,설명
 */
const parseCsvFormat = (line, employees) => {
    if (!line.includes(',')) {
        return { isValid: false, error: 'CSV 형식이 아닙니다' };
    }
    
    const parts = line.split(',').map(part => part.trim());
    
    if (parts.length < 3) {
        return { isValid: false, error: 'CSV는 최소 3개 필드가 필요합니다 (날짜, 이름, 유형)' };
    }
    
    const dateStr = parts[0];
    const employeeName = parts[1];
    const vacationType = parts[2];
    const description = parts[3] || '';
    
    // 각 필드 검증
    const dateValidation = validateDate(dateStr);
    if (!dateValidation.isValid) {
        return { isValid: false, error: dateValidation.error };
    }
    
    const employeeValidation = validateEmployee(employeeName, employees);
    if (!employeeValidation.isValid) {
        return { isValid: false, error: employeeValidation.error };
    }
    
    const typeValidation = validateVacationType(vacationType);
    if (!typeValidation.isValid) {
        return { isValid: false, error: typeValidation.error };
    }
    
    return {
        isValid: true,
        vacation: {
            date: dateValidation.date,
            employee: employeeName,
            type: typeValidation.type,
            description: description
        }
    };
};

/**
 * JSON 형식 파싱: {"date":"2025-07-15","employee":"김철수","type":"연차"}
 */
const parseJsonFormat = (line, employees) => {
    if (!line.startsWith('{') || !line.endsWith('}')) {
        return { isValid: false, error: 'JSON 형식이 아닙니다' };
    }
    
    try {
        const data = JSON.parse(line);
        
        if (!data.date || !data.employee || !data.type) {
            return { isValid: false, error: 'JSON에 필수 필드가 없습니다 (date, employee, type)' };
        }
        
        // 각 필드 검증
        const dateValidation = validateDate(data.date);
        if (!dateValidation.isValid) {
            return { isValid: false, error: dateValidation.error };
        }
        
        const employeeValidation = validateEmployee(data.employee, employees);
        if (!employeeValidation.isValid) {
            return { isValid: false, error: employeeValidation.error };
        }
        
        const typeValidation = validateVacationType(data.type);
        if (!typeValidation.isValid) {
            return { isValid: false, error: typeValidation.error };
        }
        
        return {
            isValid: true,
            vacation: {
                date: dateValidation.date,
                employee: data.employee,
                type: typeValidation.type,
                description: data.description || ''
            }
        };
        
    } catch (error) {
        return { isValid: false, error: `JSON 파싱 오류: ${error.message}` };
    }
};

/**
 * 날짜 유효성 검사
 */
const validateDate = (dateStr) => {
    // 다양한 날짜 형식 지원
    const dateFormats = [
        /^\d{4}-\d{2}-\d{2}$/,        // 2025-07-15
        /^\d{4}\/\d{2}\/\d{2}$/,      // 2025/07/15
        /^\d{4}\.\d{2}\.\d{2}$/,      // 2025.07.15
        /^\d{2}-\d{2}-\d{4}$/,        // 07-15-2025
        /^\d{2}\/\d{2}\/\d{4}$/,      // 07/15/2025
        /^\d{1,2}\/\d{1,2}$/,         // 7/15 (현재 년도)
        /^\d{1,2}-\d{1,2}$/           // 7-15 (현재 년도)
    ];
    
    let normalizedDate = dateStr;
    
    // 날짜 형식 정규화
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
        normalizedDate = dateStr.replace(/\//g, '-');
    } else if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
        normalizedDate = dateStr.replace(/\./g, '-');
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        normalizedDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        normalizedDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
    } else if (/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('/');
        const currentYear = new Date().getFullYear();
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        normalizedDate = `${currentYear}-${month}-${day}`;
    } else if (/^\d{1,2}-\d{1,2}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const currentYear = new Date().getFullYear();
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        normalizedDate = `${currentYear}-${month}-${day}`;
    }
    
    // 날짜 유효성 검사
    const date = new Date(normalizedDate);
    if (isNaN(date.getTime())) {
        return { isValid: false, error: '올바르지 않은 날짜 형식입니다' };
    }
    
    // 날짜 범위 검사 (과거 1년 ~ 미래 2년)
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const twoYearsLater = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    
    if (date < oneYearAgo || date > twoYearsLater) {
        return { isValid: false, error: '날짜는 과거 1년부터 미래 2년 사이여야 합니다' };
    }
    
    return { isValid: true, date: normalizedDate };
};

/**
 * 직원 유효성 검사
 */
const validateEmployee = (employeeName, employees) => {
    if (!employeeName || employeeName.trim() === '') {
        return { isValid: false, error: '직원명이 비어있습니다' };
    }
    
    const found = employees.find(emp => emp.name === employeeName);
    if (!found) {
        return { isValid: false, error: `직원 '${employeeName}'을(를) 찾을 수 없습니다` };
    }
    
    return { isValid: true, employee: found };
};

/**
 * 휴가 유형 유효성 검사
 */
const validateVacationType = (type) => {
    const validTypes = ['연차', '오전', '오후', '특별', '병가', '업무'];
    const typeAliases = {
        '반차': '오전',
        '오전반차': '오전',
        '오후반차': '오후',
        '특별휴가': '특별',
        '특휴': '특별',
        '연가': '연차',
        '휴가': '연차',
        '업무일정': '업무',
        '출장': '업무',
        '교육': '업무'
    };
    
    if (!type || type.trim() === '') {
        return { isValid: false, error: '휴가 유형이 비어있습니다' };
    }
    
    // 직접 매칭
    if (validTypes.includes(type)) {
        return { isValid: true, type };
    }
    
    // 별칭 매칭
    if (typeAliases[type]) {
        return { isValid: true, type: typeAliases[type] };
    }
    
    return { 
        isValid: false, 
        error: `지원하지 않는 휴가 유형입니다. 사용 가능한 유형: ${validTypes.join(', ')}` 
    };
};

/**
 * 다음 주 특정 요일까지의 일수 계산
 */
const getNextWeekday = (targetWeekday) => {
    const today = new Date();
    const currentWeekday = today.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const daysUntilNextWeek = 7 - currentWeekday;
    const daysFromNextMonday = targetWeekday - 1;
    return daysUntilNextWeek + daysFromNextMonday;
};

/**
 * 이번 주 특정 요일까지의 일수 계산
 */
const getThisWeekday = (targetWeekday) => {
    const today = new Date();
    const currentWeekday = today.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const daysUntilTarget = targetWeekday - currentWeekday;
    
    // 이미 지난 요일이면 다음 주 같은 요일로
    if (daysUntilTarget < 0) {
        return 7 + daysUntilTarget;
    }
    
    return daysUntilTarget;
};

/**
 * 휴가 데이터 중복 검사
 */
export const checkDuplicateVacations = (newVacations, existingVacations) => {
    const duplicates = [];
    
    newVacations.forEach(newVacation => {
        const existing = existingVacations.find(existing => 
            existing.date === newVacation.date && 
            existing.employee === newVacation.employee
        );
        
        if (existing) {
            duplicates.push({
                vacation: newVacation,
                existing: existing
            });
        }
    });
    
    return duplicates;
};

/**
 * 휴가 데이터 검증
 */
export const validateVacationData = (vacation) => {
    const errors = [];
    
    if (!vacation.date) {
        errors.push('날짜가 필요합니다');
    }
    
    if (!vacation.employee) {
        errors.push('직원명이 필요합니다');
    }
    
    if (!vacation.type) {
        errors.push('휴가 유형이 필요합니다');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};
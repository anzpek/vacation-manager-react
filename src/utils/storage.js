// storage.js - 로컬 스토리지 관리 (React 버전)

const STORAGE_KEYS = {
    EMPLOYEES_DATA: 'vacation_employees_data',
    VACATIONS: 'vacation_data',
    DEPARTMENTS: 'vacation_departments'
};

const COLOR_PALETTE = [
    '#FF6B6B', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#FF9F1C', '#2EC4B6', '#E71D36', '#F7B801', '#A8DADC',
    '#457B9D', '#1D3557', '#F4A261', '#E76F51', '#2A9D8F',
    '#8D99AE', '#D8BFD8', '#FFC0CB'
];

const DEFAULT_DEPARTMENTS = [
    {
        id: 'planning',
        name: '기획부',
        manager: null,
        teams: []
    },
    {
        id: 'admin', 
        name: '총무부',
        manager: null,
        teams: [
            { 
                id: 'guidance', 
                name: '보상지도팀', 
                leader: '강능훈', 
                members: ['강능훈', '박민', '배영제', '임국단'] 
            }
        ]
    },
    {
        id: 'support',
        name: '보상지원부', 
        manager: null,
        teams: [
            { 
                id: 'customer', 
                name: '고객만족팀', 
                leader: '이용진', 
                members: ['이용진', '정예원', '정욱군'] 
            },
            { 
                id: 'compensation', 
                name: '보상관리팀', 
                leader: '강태호', 
                members: ['강태호', '백순열', '장순아'] 
            }
        ]
    },
    {
        id: 'audit',
        name: '감사실',
        manager: null,
        teams: []
    }
];

const DEFAULT_EMPLOYEE_DATA = {
    '이용진': { color: '#FF6B6B', hidden: false, department: 'support', team: 'customer', role: 'leader' },
    '정예원': { color: '#FFD166', hidden: false, department: 'support', team: 'customer', role: 'member' },
    '정욱군': { color: '#06D6A0', hidden: false, department: 'support', team: 'customer', role: 'member' },
    '강태호': { color: '#118AB2', hidden: false, department: 'support', team: 'compensation', role: 'leader' },
    '백순열': { color: '#073B4C', hidden: false, department: 'support', team: 'compensation', role: 'member' },
    '장순아': { color: '#FF9F1C', hidden: false, department: 'support', team: 'compensation', role: 'member' },
    '강능훈': { color: '#2EC4B6', hidden: false, department: 'admin', team: 'guidance', role: 'leader' },
    '박민': { color: '#E71D36', hidden: false, department: 'admin', team: 'guidance', role: 'member' },
    '배영제': { color: '#F7B801', hidden: false, department: 'admin', team: 'guidance', role: 'member' },
    '임국단': { color: '#A8DADC', hidden: false, department: 'admin', team: 'guidance', role: 'member' }
};

// 로컬 스토리지에서 데이터 로드
export const loadFromStorage = (key) => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS[key]);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error loading ${key} from storage:`, error);
        return null;
    }
};

// 로컬 스토리지에 데이터 저장
export const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving ${key} to storage:`, error);
        return false;
    }
};

// 직원 데이터 초기화 및 로드
export const initializeEmployees = () => {
    const employeeData = loadFromStorage('EMPLOYEES_DATA');
    if (employeeData) {
        return employeeData;
    } else {
        saveToStorage('EMPLOYEES_DATA', DEFAULT_EMPLOYEE_DATA);
        return DEFAULT_EMPLOYEE_DATA;
    }
};

// 부서 데이터 초기화 및 로드
export const initializeDepartments = () => {
    const departments = loadFromStorage('DEPARTMENTS');
    if (departments) {
        return departments;
    } else {
        const defaultDepts = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
        saveToStorage('DEPARTMENTS', defaultDepts);
        return defaultDepts;
    }
};

// 휴가 데이터 로드
export const initializeVacations = () => {
    const vacations = loadFromStorage('VACATIONS');
    return vacations || {};
};

// 직원 배열로 변환
export const convertEmployeeDataToArray = (employeeData) => {
    return Object.keys(employeeData).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, ''),
        name: name,
        department: employeeData[name].department || 'unknown',
        team: employeeData[name].team || 'unknown', 
        role: employeeData[name].role || 'member',
        color: employeeData[name].color || '#CCCCCC',
        hidden: employeeData[name].hidden || false
    })).sort((a, b) => a.name.localeCompare(b.name));
};

// 직원 배열을 객체로 변환
export const convertEmployeeArrayToData = (employees) => {
    const employeeData = {};
    employees.forEach(emp => {
        employeeData[emp.name] = {
            color: emp.color || '#CCCCCC',
            hidden: emp.hidden || false,
            department: emp.department || null,
            team: emp.team || null,
            role: emp.role || 'member'
        };
    });
    return employeeData;
};

// 새 색상 할당
export const getNextAvailableColor = (employeeData = {}) => {
    // employeeData가 null이거나 undefined인 경우 빈 객체로 처리
    const safeEmployeeData = employeeData || {};
    
    try {
        const assignedColors = Object.values(safeEmployeeData).map(data => data?.color).filter(color => color);
        const availableColors = COLOR_PALETTE.filter(color => !assignedColors.includes(color));
        
        if (availableColors.length > 0) {
            return availableColors[0];
        } else {
            return COLOR_PALETTE[Object.keys(safeEmployeeData).length % COLOR_PALETTE.length];
        }
    } catch (error) {
        console.error('색상 할당 중 오류:', error);
        return COLOR_PALETTE[0]; // 기본 색상 반환
    }
};

// 데이터 내보내기
export const exportData = (employees, vacations) => {
    const data = {
        employees: employees,
        vacations: vacations,
        exportDate: new Date().toISOString().split('T')[0]
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], 
        { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `휴가관리_${data.exportDate.replace(/\-/g, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// 데이터 가져오기
export const importData = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        return {
            success: true,
            employees: data.employees || null,
            vacations: data.vacations || null
        };
    } catch (error) {
        console.error('데이터 가져오기 실패:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// 전체 데이터 초기화
export const clearAllData = () => {
    if (window.confirm('모든 데이터를 삭제하시겠습니까?')) {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    }
    return false;
};

export { COLOR_PALETTE, DEFAULT_DEPARTMENTS, DEFAULT_EMPLOYEE_DATA, STORAGE_KEYS };

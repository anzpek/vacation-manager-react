// BatchInput.jsx - 새로운 모달 시스템 사용
import React, { useState, useEffect, useCallback } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import Modal from '../Common/Modal';
import './BatchInput.css';

const BatchInput = ({ isOpen, onClose }) => {
    const { state, actions } = useVacation();
    const [inputText, setInputText] = useState('');
    const [parsedData, setParsedData] = useState([]);
    const [parseErrors, setParseErrors] = useState([]);
    const [parseWarnings, setParseWarnings] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // 텍스트 입력 시 자동 파싱 (디바운스)
    useEffect(() => {
        if (!inputText.trim()) {
            setParsedData([]);
            setParseErrors([]);
            setParseWarnings([]);
            return;
        }

        const timer = setTimeout(() => {
            parseInput();
        }, 500);

        return () => clearTimeout(timer);
    }, [inputText]);

    // 강력한 다중 형식 날짜 파싱 로직
    const parseInput = useCallback(() => {
        if (!inputText.trim()) return;

        const parsed = [];
        const errors = [];
        const warnings = [];
        
        // 줄 단위로 분리 (여러 구분자 허용)
        const lines = inputText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line);
        
        let currentEmployee = null;
        let employeeData = null;
        const currentYear = new Date().getFullYear();

        // 강력한 날짜 파싱 함수
        const parseDate = (dateStr) => {
            // 반차 타입 추출
            let vacationType = '연차';
            let cleanDateStr = dateStr;
            
            const halfDayMatch = dateStr.match(/\((오전|오후|AM|PM|am|pm)\)/i);
            if (halfDayMatch) {
                const halfType = halfDayMatch[1].toLowerCase();
                vacationType = (halfType === '오전' || halfType === 'am') ? '오전' : '오후';
                cleanDateStr = dateStr.replace(/\([^)]*\)/g, '').trim();
            }

            // 다양한 날짜 패턴들
            const patterns = [
                // YYYYMMDD
                { regex: /^(\d{4})(\d{2})(\d{2})$/, year: 1, month: 2, day: 3 },
                // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
                { regex: /^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/, year: 1, month: 2, day: 3 },
                // YY-MM-DD, YY/MM/DD, YY.MM.DD
                { regex: /^(\d{2})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/, year: 1, month: 2, day: 3, shortYear: true },
                // YYMMDD  
                { regex: /^(\d{2})(\d{2})(\d{2})$/, year: 1, month: 2, day: 3, shortYear: true },
                // MMDD (기존 형식)
                { regex: /^(\d{2})(\d{2})$/, month: 1, day: 2 },
                // MM-DD, MM/DD, MM.DD
                { regex: /^(\d{1,2})[-\/\.](\d{1,2})$/, month: 1, day: 2 },
                // M/DD, M-DD
                { regex: /^(\d{1})[-\/](\d{1,2})$/, month: 1, day: 2 },
                // DD (일만 입력, 현재 월로 추정)
                { regex: /^(\d{1,2})$/, day: 1, currentMonth: true }
            ];

            for (const pattern of patterns) {
                const match = cleanDateStr.match(pattern.regex);
                if (match) {
                    let year, month, day;
                    
                    if (pattern.year) {
                        year = parseInt(match[pattern.year]);
                        if (pattern.shortYear) {
                            // 2자리 연도를 4자리로 변환 (25 = 2025, 24 = 2024)
                            year = year < 50 ? 2000 + year : 1900 + year;
                        }
                    } else {
                        year = currentYear;
                    }
                    
                    if (pattern.month) {
                        month = parseInt(match[pattern.month]);
                    } else if (pattern.currentMonth) {
                        month = new Date().getMonth() + 1;
                    }
                    
                    day = parseInt(match[pattern.day]);

                    // 날짜 유효성 검사
                    if (month < 1 || month > 12 || day < 1 || day > 31) {
                        return null;
                    }

                    // Date 객체로 유효성 재확인
                    const dateObj = new Date(year, month - 1, day);
                    if (dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
                        return null;
                    }

                    const yearFormatted = dateObj.getFullYear();
                    const monthFormatted = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dayFormatted = String(dateObj.getDate()).padStart(2, '0');
                    
                    return {
                        date: `${yearFormatted}-${monthFormatted}-${dayFormatted}`,
                        type: vacationType,
                        originalText: dateStr,
                        parsedAs: `${yearFormatted}/${monthFormatted}/${dayFormatted} (${vacationType})`
                    };
                }
            }
            
            return null;
        };

        lines.forEach((line, index) => {
            // 쉼표나 세미콜론으로 구분된 여러 날짜 처리
            const dateParts = line.split(/[,;，；]+/).map(part => part.trim()).filter(part => part);
            
            let hasValidDate = false;
            
            for (const part of dateParts) {
                const dateResult = parseDate(part);
                
                if (dateResult) {
                    hasValidDate = true;
                    // 날짜로 인식됨
                    if (!currentEmployee) {
                        errors.push(`${index + 1}번 줄: 직원 이름 없이 날짜가 입력되었습니다. (${part})`);
                        continue;
                    }

                    employeeData.vacations.push(dateResult);
                }
            }
            
            if (!hasValidDate) {
                // 날짜로 인식되지 않음 → 직원 이름으로 처리
                if (employeeData && employeeData.vacations.length > 0) {
                    parsed.push(employeeData);
                }

                currentEmployee = line;
                employeeData = {
                    name: currentEmployee,
                    vacations: []
                };

                // 직원 이름이 기존 목록에 없으면 알림
                const employeeNames = state.employees.map(emp => emp.name);
                if (!employeeNames.includes(currentEmployee)) {
                    warnings.push(`'${currentEmployee}'는 등록되지 않은 직원입니다. 자동으로 추가됩니다.`);
                }
            }
        });

        // 마지막 직원 데이터 저장
        if (employeeData && employeeData.vacations.length > 0) {
            parsed.push(employeeData);
        }

        setParsedData(parsed);
        setParseErrors(errors);
        setParseWarnings(warnings);
    }, [inputText, state.employees]);

    // 파싱된 데이터 등록
    const handleRegisterParsedData = useCallback(async () => {
        if (parsedData.length === 0) {
            alert('등록할 데이터가 없습니다.');
            return;
        }

        setIsProcessing(true);
        
        try {
            let successCount = 0;
            let newEmployees = [];
            let overwriteCount = 0;
            let updatedEmployees = [...state.employees]; // 최신 직원 배열 복사

            // 각 직원의 휴가 등록
            for (const employee of parsedData) {
                // 신규 직원인 경우 추가
                let employeeObj = updatedEmployees.find(emp => emp.name === employee.name);
                
                if (!employeeObj) {
                    const newEmployee = {
                        name: employee.name,
                        team: '기타',
                        position: 'member',
                        color: null // 자동 색상 할당을 위해 null 설정
                    };
                    
                    employeeObj = await actions.addEmployee(newEmployee);
                    updatedEmployees.push(employeeObj);
                    newEmployees.push(employee.name);
                    console.log(`[BatchInput] ✅ 새 직원 추가: ${employee.name} (ID: ${employeeObj.id})`);
                }

                // 휴가 등록 (비동기 순차 처리)
                for (const vacation of employee.vacations) {
                    try {
                        // 기존 휴가가 있는지 확인 (localStorage에서 최신 데이터 확인)
                        const currentDepartment = JSON.parse(localStorage.getItem('currentDepartment') || '{}');
                        const storageKey = `vacations_${currentDepartment.code || 'default'}`;
                        const currentVacations = JSON.parse(localStorage.getItem(storageKey) || '[]');
                        const existingVacation = currentVacations.find(v => 
                            v.date === vacation.date && 
                            v.employeeId === employeeObj.id
                        );
                        
                        if (existingVacation) {
                            overwriteCount++;
                            await actions.deleteVacation(existingVacation.id);
                        }
                        
                        // 휴가 추가
                        const newVacation = {
                            date: vacation.date,
                            employeeId: employeeObj.id,
                            type: vacation.type
                        };
                        
                        await actions.addVacation(newVacation);
                        successCount++;
                        
                        console.log(`[BatchInput] ✅ 휴가 등록 완료: ${employeeObj.name} - ${vacation.date} (${vacation.type})`);
                    } catch (error) {
                        console.error(`[BatchInput] ❌ 휴가 등록 실패: ${employeeObj.name} - ${vacation.date}`, error);
                    }
                }
            }

            // 등록 완료 후 잠시 대기 (state 업데이트 완료 대기)
            console.log('[BatchInput] 🔄 state 동기화 대기...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 모든 직원들을 포함하여 필터 초기화 (기존 + 새로 추가된 직원들)
            console.log('[BatchInput] 🔄 필터 초기화 중...');
            
            // 최신 직원 목록에서 모든 직원 ID를 가져오기
            const allEmployeeIds = updatedEmployees.map(emp => emp.id);
            const newEmployeeIds = newEmployees.map(empName => {
                const employee = updatedEmployees.find(emp => emp.name === empName);
                return employee ? employee.id : null;
            }).filter(Boolean);
            
            // 휴가가 등록된 모든 직원들의 ID 수집
            const employeesWithVacations = parsedData.map(emp => {
                const employee = updatedEmployees.find(e => e.name === emp.name);
                return employee ? employee.id : null;
            }).filter(Boolean);
            
            console.log('[BatchInput] 📋 새로 추가된 직원 ID들:', newEmployeeIds);
            console.log('[BatchInput] 📋 휴가가 등록된 직원 ID들:', employeesWithVacations);
            console.log('[BatchInput] 📋 모든 직원 ID들 (업데이트된):', allEmployeeIds);
            console.log('[BatchInput] 📋 기존 state.employees:', state.employees.map(emp => emp.id));
            
            // 모든 직원을 필터에 포함 (기존 직원 + 새로 추가된 직원)
            actions.setFilters({
                selectedEmployees: allEmployeeIds,
                selectedTeams: []
            });
            console.log('[BatchInput] ✅ state 동기화 완료');

            let message = `${successCount}건의 휴가가 성공적으로 등록되었습니다.`;
            if (overwriteCount > 0) {
                message += `\n(기존 휴가 ${overwriteCount}건이 덮어쓰기되었습니다.)`;
            }
            if (newEmployees.length > 0) {
                message += `\n\n새로 추가된 직원: ${newEmployees.join(', ')}`;
            }

            alert(message);
            handleClose();
        } catch (error) {
            console.error('일괄 등록 오류:', error);
            alert('등록 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    }, [parsedData, state.employees, state.vacations, actions]);

    // 모달 닫기
    const handleClose = useCallback(() => {
        setInputText('');
        setParsedData([]);
        setParseErrors([]);
        setParseWarnings([]);
        onClose();
    }, [onClose]);

    // 예시 텍스트 삽입
    const insertExample = useCallback(() => {
        const exampleText = `김철수
0715
2025/07/16(오전)
25-07-17
7/18

박영희
20250719
0720(오후)
0721, 0722, 0723

정개발
2025.07.24
25/07/25
26`;
        setInputText(exampleText);
    }, []);

    // 총 휴가 건수 계산
    const totalVacations = parsedData.reduce((sum, emp) => sum + emp.vacations.length, 0);

    return (
        <Modal 
            isOpen={isOpen}
            onClose={handleClose}
            title="일괄 휴가 입력"
            size="xlarge"
            className="batch-input-modal"
        >
            <div className="compact-batch-layout">
                {/* 왼쪽: 입력 영역 */}
                <div className="input-panel">
                    <div className="input-header">
                        <div className="input-title">
                            <span>📝 데이터 입력</span>
                            <button 
                                className="example-btn" 
                                onClick={insertExample}
                                title="예시 텍스트 삽입"
                            >
                                💡 예시
                            </button>
                        </div>
                        <div className="quick-guide">
                            <span className="guide-item">👤 이름</span>
                            <span className="guide-separator">→</span>
                            <span className="guide-item">📅 날짜 (MMDD, YYYY-MM-DD 등)</span>
                            <span className="guide-separator">→</span>
                            <span className="guide-item">⏭️ 빈줄로 구분</span>
                        </div>
                    </div>
                    
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="김철수&#10;0715&#10;0716(오전)&#10;&#10;박영희&#10;2025-07-20&#10;0721, 0722"
                        className="compact-textarea"
                    />
                    
                    <div className="input-actions">
                        <button 
                            className="register-btn"
                            onClick={handleRegisterParsedData}
                            disabled={parsedData.length === 0 || parseErrors.length > 0 || isProcessing}
                        >
                            {isProcessing ? '등록 중...' : `휴가 등록 (${totalVacations}건)`}
                        </button>
                        <button className="cancel-btn" onClick={handleClose}>
                            취소
                        </button>
                    </div>
                </div>
                
                {/* 오른쪽: 결과 영역 */}
                <div className="result-panel">
                    <div className="result-header">
                        <span>🔍 파싱 결과</span>
                        {totalVacations > 0 && (
                            <div className="result-stats">
                                <span className="stat-badge">{parsedData.length}명</span>
                                <span className="stat-badge">{totalVacations}건</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="result-content">
                        {/* 에러 표시 */}
                        {parseErrors.length > 0 && (
                            <div className="error-section">
                                <div className="error-header">❌ 파싱 오류</div>
                                {parseErrors.map((error, index) => (
                                    <div key={index} className="error-item">{error}</div>
                                ))}
                            </div>
                        )}
                        
                        {/* 경고 표시 */}
                        {parseWarnings.length > 0 && (
                            <div className="warning-section">
                                <div className="warning-header">⚠️ 주의사항</div>
                                {parseWarnings.map((warning, index) => (
                                    <div key={index} className="warning-item">{warning}</div>
                                ))}
                            </div>
                        )}
                        
                        {/* 성공 결과 표시 */}
                        {parsedData.length > 0 && parseErrors.length === 0 && (
                            <div className="success-section">
                                <div className="success-header">✅ 파싱 완료</div>
                                <div className="employee-list">
                                    {parsedData.map((employee, index) => (
                                        <div key={index} className="employee-result">
                                            <div className="employee-name">{employee.name}</div>
                                            <div className="vacation-tags">
                                                {employee.vacations.map((vacation, vIndex) => (
                                                    <span key={vIndex} className="vacation-tag">
                                                        {vacation.date.replace(/^2025-/, '')}
                                                        {vacation.type !== '연차' && (
                                                            <span className="vacation-type">({vacation.type})</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* 입력이 없을 때 */}
                        {!inputText.trim() && (
                            <div className="empty-state">
                                <div className="empty-icon">📝</div>
                                <div className="empty-text">왼쪽에 휴가 데이터를 입력하세요</div>
                                <div className="empty-subtitle">실시간으로 파싱 결과가 표시됩니다</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BatchInput;
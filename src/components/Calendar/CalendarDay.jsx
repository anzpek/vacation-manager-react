import React from 'react';
import { useVacation } from '../../contexts/VacationContext';
import {
    isToday as checkIsToday,
    isHoliday as checkIsHoliday,
    getHolidayName,
    isWeekendDay,
    formatDateToKorean
} from '../../utils/dateUtils';
import './CalendarDay.css';

const CalendarDay = React.forwardRef(({
    date,
    dateString,
    isCurrentMonth,
    isSunday,
    isSaturday,
    isToday,
    holiday,
    employees,
    vacations, // This will now be fullDayVacations
    halfDayVacations, // New prop for half-day vacations
    getConsecutiveGroupForDate,
    dayWidth // dayWidth prop 추가
}, ref) => {
    const { actions } = useVacation();
    
    const dayNumber = date.getDate();
    const isHolidayDate = holiday; // Use passed holiday prop
    const holidayName = holiday ? holiday.name : '';
    const isWeekend = isWeekendDay(date);

    // 클래스명 생성
    const dayClasses = [
        'calendar-day',
        !isCurrentMonth && 'other-month',
        isToday && 'today',
        isSunday && 'sunday',
        isSaturday && 'saturday',
        isHolidayDate && 'holiday',
        vacations.length > 0 && 'has-vacation'
    ].filter(Boolean).join(' ');

    // 날짜 클릭 핸들러
    const handleDayClick = () => {
        if (!isCurrentMonth) return;
        
        actions.openModal('addVacation', {
            date: dateString,
            employee: null,
            type: '연차'
        });
    };

    // 휴가 클릭 핸들러
    const handleVacationClick = (e, vacation) => {
        e.stopPropagation();
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        
        // 업무 일정일 때 설명 표시
        const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
        if (vacation.type === '업무' && vacation.description) {
            const message = `${employee?.name || '알 수 없음'}님의 업무 일정\n\n📋 업무 내용: ${vacation.description}\n\n수정하시겠습니까?`;
            if (window.confirm(message)) {
                actions.openModal('editVacation', {
                    date: dateString,
                    vacation: vacation,
                    employee: employee,
                    consecutiveGroup: consecutiveGroup // consecutiveGroup 정보 추가
                });
            }
        } else {
            actions.openModal('editVacation', {
                date: dateString,
                vacation: vacation,
                employee: employee,
                consecutiveGroup: consecutiveGroup // consecutiveGroup 정보 추가
            });
        }
    };

    // 휴가 유형별 스타일 클래스
    const getVacationTypeClass = (type) => {
        switch (type) {
            case '연차': return 'vacation-annual';
            case '오전': return 'vacation-morning';
            case '오후': return 'vacation-afternoon';
            case '특별': return 'vacation-special';
            case '병가': return 'vacation-sick';
            case '업무': return 'vacation-work';
            default: return 'vacation-annual';
        }
    };

    // 직원 색상 가져오기
    const getEmployeeColor = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) {
            return '#ff6b6b'; // 빨간색으로 표시하여 문제 있는 휴가 시각화
        }
        return employee.color || '#6B7280';
    };

    // 셀 높이 계산 (휴가 개수에 따라 동적 조절)
    const calculateCellHeight = () => {
        const baseHeight = 100; // 기본 최소 높이
        const barHeight = 22; // 각 휴가 막대바 높이 + 여백
        const headerHeight = 40; // 날짜 헤더 높이
        const padding = 12; // 여백
        const halfDayHeight = 20; // 반차 높이
        
        // 일반 휴가 개수 (연차, 특별, 병가, 업무)
        const fullDayCount = vacations.filter(v => !['오전', '오후'].includes(v.type)).length;
        
        // 반차가 있는 경우 한 줄로 처리 (오전, 오후 합쳐서)
        const hasHalfDay = halfDayVacations.length > 0 ? 1 : 0;
        
        const totalBars = fullDayCount + hasHalfDay;
        const requiredHeight = headerHeight + (totalBars * barHeight) + (hasHalfDay * halfDayHeight) + padding;
        
        return Math.max(baseHeight, requiredHeight);
    };

    // 반차 연속휴가 처리 함수
    const renderHalfDayVacationBar = (vacation, index, isOtherHalfVisible) => {
        const employeeColor = getEmployeeColor(vacation.employeeId);
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
        
        // 연속휴가 내의 반차 처리 로직 개선
        if (consecutiveGroup && consecutiveGroup.isConsecutive) {
            const isStartOfGroup = consecutiveGroup.startDate === dateString;
            const isEndOfGroup = consecutiveGroup.endDate === dateString;
            
            // 연휴 시작일이나 끝일의 반차는 연휴 막대바와 함께 렌더링되므로 개별 반차는 표시하지 않음
            if (isStartOfGroup || isEndOfGroup) {
                return null;
            }
        }
        
        // 단독 반차는 기존 로직 유지
        return (
            <div
                key={`${vacation.type}-${vacation.employeeId}-${index}`}
                className={`half-vacation-bar ${vacation.type === '오전' ? 'morning' : 'afternoon'}`}
                style={{ 
                    backgroundColor: employeeColor,
                    borderColor: employeeColor,
                    justifyContent: 'center',
                    textAlign: 'center'
                }}
                onClick={(e) => handleVacationClick(e, vacation)}
                title={`${employee ? employee.name : '알 수 없음'} - ${vacation.type}반차`}
            >
                <span className="half-vacation-text">
                    {employee ? employee.name : '알 수 없음'}
                </span>
            </div>
        );
    };

    // 휴가 막대바 렌더링
    const renderVacationBar = (vacation, index) => {
        
        const employeeColor = getEmployeeColor(vacation.employeeId);
        const vacationTypeClass = getVacationTypeClass(vacation.type);
        const employee = employees.find(emp => emp.id === vacation.employeeId);

        // 직원이 없으면 임시로 알 수 없음으로 표시

        const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
        
        const isStartOfGroup = consecutiveGroup && consecutiveGroup.startDate === dateString;
        const isEndOfGroup = consecutiveGroup && consecutiveGroup.endDate === dateString;
        const isMiddleOfGroup = consecutiveGroup && !isStartOfGroup && !isEndOfGroup;
        
        // 렌더링 조건 결정

        // 연휴 렌더링 조건 개선 - 더 엄격한 검증
        if (consecutiveGroup && consecutiveGroup.isConsecutive) {
            // 연휴 데이터 무결성 체크
            if (!consecutiveGroup.vacations || consecutiveGroup.vacations.length === 0) {
                return null;
            }
            
            // 현재 날짜가 이 직원의 연속휴가에 실제로 포함되는지 확인
            const hasVacationOnThisDate = consecutiveGroup.vacations.some(v => 
                v.date === dateString && v.employeeId === vacation.employeeId
            );
            
            if (!hasVacationOnThisDate) {
                return null;
            }
            
            if (!isStartOfGroup) {
                return null;
            }
        }
        
        // 연휴가 아닌 경우: 정상적으로 렌더링 (단독 휴가 포함)
        if (!consecutiveGroup || !consecutiveGroup.isConsecutive) {
            // Calendar.jsx에서 온 가상 휴가는 렌더링하지 않음
            if (vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) {
                return null;
            }
        }

        let barStyle = {
            backgroundColor: employeeColor,
            borderLeftColor: employeeColor,
            boxShadow: `0 0 0 1px ${employeeColor}40`,
        };


        let barWidth = '100%';
        let positionStyle = {};
        let extraClass = '';
        let firstFullDayDate = '';
        let lastFullDayDate = '';
        let sortedFullDayVacations = [];

        if (consecutiveGroup && consecutiveGroup.isConsecutive) {
            // 🔧 연속휴가 그룹 재검증: Calendar.jsx의 getConsecutiveGroupForDate가 null을 반환했으면 연속휴가 처리 안함
            const reValidatedGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
            if (!reValidatedGroup || !reValidatedGroup.isConsecutive) {
                // 단일 휴가로 다시 처리
                const topPosition = (index * 22) + 6;
                positionStyle = {
                    position: 'absolute',
                    left: '6px',
                    top: `${topPosition}px`,
                    zIndex: 15,
                    width: 'calc(100% - 12px)',
                    height: '18px',
                    borderRadius: '8px',
                };
            } else {
                // 연휴 막대바 너비 계산: 전체 연휴 기간 (반차 + 연차 모두 포함)
                const holidayStartDate = new Date(consecutiveGroup.startDate);
                const holidayEndDate = new Date(consecutiveGroup.endDate);
                
                // 시작과 끝 휴가 정보
                const startVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.startDate);
                const endVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.endDate);
                
                // 연휴 막대바 계산
                
                // 연휴 막대바 시작 위치 계산
                const isStartHalfDay = ['오전', '오후'].includes(startVacation?.type);
                const isEndHalfDay = ['오전', '오후'].includes(endVacation?.type);
                
                // 막대바 시작 위치 (시작일이 오후반차면 50%부터 시작)
                const startOffset = (isStartHalfDay && startVacation.type === '오후') ? 0.5 : 0;
                
                // 막대바 끝 위치 (끝일이 오전반차면 50%까지만)
                const endOffset = (isEndHalfDay && endVacation.type === '오전') ? 0.5 : 1;
                
                // 전체 일수 계산
                const totalDays = (holidayEndDate.getTime() - holidayStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
                const effectiveWidth = (totalDays - 1) + endOffset - startOffset;
                
                // 막대바 너비 계산 완료
                
                const duration = effectiveWidth;
                
                // 연속휴가는 absolute 위치로 설정하여 여러 셀에 걸쳐 표시
                const effectiveDayWidth = dayWidth && dayWidth > 0 ? dayWidth : 140;
                const barWidthValue = (duration * effectiveDayWidth) - 12; // 연차 부분의 기간만큼 너비 설정
                barWidth = `${barWidthValue}px`;
                
                // 연휴 막대바 위치 계산: 시작일 기준으로 계산
                const leftPosition = startOffset * effectiveDayWidth; // 시작 오프셋만큼 우측으로 이동
                
                const topPosition = (index * 22) + 6;
                
                positionStyle = {
                    position: 'absolute',
                    left: `${6 + leftPosition}px`, // 시작 오프셋 적용
                    top: `${topPosition}px`, // index 기반 위치 (정렬 순서 반영)
                    zIndex: 20, // 높은 z-index로 다른 요소 위에 표시
                    width: barWidth,
                    height: '18px',
                    overflow: 'visible',
                    borderRadius: '8px',
                };
                extraClass = 'consecutive-bar';
            }
        } else {
            // 단일 휴가도 absolute 위치로 설정하여 정렬 순서 보장
            const topPosition = (index * 22) + 6;
            
            positionStyle = {
                position: 'absolute',
                left: '6px',
                top: `${topPosition}px`,
                zIndex: 15, // 연속휴가보다 낮은 z-index
                width: 'calc(100% - 12px)', // 양쪽 여백 6px씩 제거하여 셀 내에서만 표시
                height: '18px',
                borderRadius: '8px',
            };
        }

        // 연속휴가인지 확인하여 텍스트 형식 결정
        const isConsecutiveVacation = consecutiveGroup && consecutiveGroup.isConsecutive;
        
        const result = (
            <div
                key={`vacation-${vacation.employeeId}-${vacation.type}-${index}`}
                className={`vacation-bar ${vacationTypeClass} ${extraClass}`}
                style={{ ...barStyle, ...positionStyle }}
                onClick={(e) => {
                    // 가상 휴가인 경우 원본 휴가 정보로 클릭 처리
                    if ((vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) && consecutiveGroup && consecutiveGroup.vacations.length > 0) {
                        const originalVacation = consecutiveGroup.vacations.find(v => v.date === dateString);
                        if (originalVacation) {
                            handleVacationClick(e, originalVacation);
                            return;
                        }
                    }
                    handleVacationClick(e, vacation);
                }}
                title={`${employee ? employee.name : '알 수 없음'} - ${(vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) ? '연휴' : vacation.type}${vacation.description ? ` (${vacation.description})` : ''}`}
            >
                {isConsecutiveVacation ? (
                    <div className="vacation-content consecutive-vacation-content">
                        <span className="consecutive-vacation-text">
                            {employee ? employee.name : '알 수 없음'} {new Date(consecutiveGroup.startDate).getDate()}일 ~ {new Date(consecutiveGroup.endDate).getDate()}일 연휴
                        </span>
                    </div>
                ) : (
                    <div className="vacation-content single-vacation-content">
                        <span className="single-vacation-text">
                            {employee ? employee.name : '알 수 없음'} {vacation.type}
                        </span>
                    </div>
                )}
            </div>
        );
        
        return result;
    };

    const cellHeight = calculateCellHeight();

    return (
        <div 
            className={dayClasses}
            onClick={handleDayClick}
            title={isHolidayDate ? holidayName : ''}
            style={{ minHeight: `${cellHeight}px` }}
            ref={ref}
        >
            <div className="day-header">
                <span className="day-number">{dayNumber}</span>
                {isHolidayDate && (
                    <span className="holiday-name">{holidayName}</span>
                )}
            </div>

            <div className="day-content">
                {/* 일반 휴가 표시 (연차, 특별, 병가, 업무) + 연속휴가 막대바 */}
                <div className="full-day-vacations">
                    {(() => {
                        let fullDayVacations = vacations.filter(v => !['오전', '오후'].includes(v.type));
                        
                        // 반차로 시작하는 연속휴가 처리: 해당 날짜에 연휴 막대바를 렌더링하기 위해 가상 휴가 추가
                        const halfDayVacations = vacations.filter(v => ['오전', '오후'].includes(v.type));
                        halfDayVacations.forEach(halfVacation => {
                            const consecutiveGroup = getConsecutiveGroupForDate(date, halfVacation.employeeId);
                            if (consecutiveGroup && consecutiveGroup.isConsecutive) {
                                const isStartOfGroup = consecutiveGroup.startDate === dateString;
                                
                                // 연속휴가 시작일이고 fullDay 휴가가 없는 경우, 연휴 막대바 렌더링을 위한 가상 휴가 추가
                                if (isStartOfGroup && !fullDayVacations.some(v => v.employeeId === halfVacation.employeeId)) {
                                    fullDayVacations.push({
                                        ...halfVacation,
                                        type: '연휴', // 가상 타입
                                        isVirtualForConsecutive: true // 가상 휴가 표시
                                    });
                                }
                            }
                        });
                        
                        
                        const sorted = fullDayVacations.sort((a, b) => {
                            // CalendarDay에서 직접 정렬: 연속휴가 기간 기준
                            const groupA = getConsecutiveGroupForDate(date, a.employeeId);
                            const groupB = getConsecutiveGroupForDate(date, b.employeeId);
                            
                            const durationA = groupA ? 
                                (new Date(groupA.endDate).getTime() - new Date(groupA.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
                                1;
                            const durationB = groupB ? 
                                (new Date(groupB.endDate).getTime() - new Date(groupB.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
                                1;
                            
                            // 정렬 진행
                            
                            if (durationA !== durationB) {
                                return durationB - durationA; // 긴 연휴가 먼저
                            }
                            return a.employeeId - b.employeeId;
                        });
                        
                        // 정렬 완료
                        
                        const rendered = sorted.map((vacation, index) => {
                            return renderVacationBar(vacation, index);
                        }).filter(Boolean); // null 제거
                        
                        return rendered;
                    })()}
                </div>

                {/* 반차 렌더링 (좌우로 구분) */}
                {(() => {
                    const morningVacations = halfDayVacations.filter(v => v.type === '오전');
                    const afternoonVacations = halfDayVacations.filter(v => v.type === '오후');
                    
                    // 반차로 시작하는 연속휴가가 있는지 확인
                    const hasConsecutiveHalfDay = [...morningVacations, ...afternoonVacations].some(vacation => {
                        const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
                        if (!consecutiveGroup || !consecutiveGroup.isConsecutive) return false;
                        
                        const startDateVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.startDate);
                        const isHalfDayStart = startDateVacation && ['오전', '오후'].includes(startDateVacation.type);
                        const isStartOfGroup = consecutiveGroup.startDate === dateString;
                        
                        return isHalfDayStart && isStartOfGroup;
                    });
                    
                    // 일반 휴가 개수를 계산하여 반차 시작 위치 결정 (반차 연속휴가가 있으면 위치 조정)
                    const visibleFullDayCount = vacations.filter(v => {
                        if (['오전', '오후'].includes(v.type)) return false;
                        
                        // 반차로 시작하는 연속휴가의 연차 부분은 카운트하지 않음
                        const consecutiveGroup = getConsecutiveGroupForDate(date, v.employeeId);
                        if (consecutiveGroup && consecutiveGroup.isConsecutive) {
                            const startDateVacation = consecutiveGroup.vacations.find(vacation => vacation.date === consecutiveGroup.startDate);
                            const isHalfDayStart = startDateVacation && ['오전', '오후'].includes(startDateVacation.type);
                            if (isHalfDayStart) return false; // 반차로 시작하는 연속휴가는 제외
                        }
                        return true;
                    }).length;
                    
                    const halfDayStartTop = hasConsecutiveHalfDay ? 6 : (visibleFullDayCount * 22) + 6;
                    const halfDayZIndex = hasConsecutiveHalfDay ? 20 : 10;
                    
                    if (morningVacations.length === 0 && afternoonVacations.length === 0) {
                        return null;
                    }

                    return (
                        <div 
                            className="half-day-container"
                            style={{
                                position: 'absolute',
                                top: `${halfDayStartTop}px`,
                                left: '6px',
                                width: 'calc(100% - 12px)',
                                zIndex: halfDayZIndex
                            }}
                        >
                            {/* 오전반차 - 좌측에 표시 */}
                            <div className="morning-half">
                                {morningVacations.map((vacation, index) => {
                                    const result = renderHalfDayVacationBar(vacation, index, afternoonVacations.length > 0);
                                    return result;
                                }).filter(Boolean)}
                            </div>
                            
                            {/* 오후반차 - 우측에 표시 */}
                            <div className="afternoon-half">
                                {afternoonVacations.map((vacation, index) => {
                                    const result = renderHalfDayVacationBar(vacation, index, morningVacations.length > 0);
                                    return result;
                                }).filter(Boolean)}
                            </div>
                        </div>
                    );
                })()}
                
                {/* 빈 날짜에 추가 힌트 표시 - 다크모드 호환성 개선 */}
                {isCurrentMonth && vacations.length === 0 && (
                    <div className="add-vacation-hint">
                        <div className="add-vacation-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}); // 여기에 닫는 괄호와 세미콜론 추가

export default CalendarDay;
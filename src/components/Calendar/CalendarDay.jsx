import React from 'react';
import { useVacation } from '../../contexts/VacationContext';
import {
    isWeekendDay
} from '../../utils/dateUtils.ts';
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
    
    // 휴가 타입별 라벨 반환 함수
    const getVacationTypeLabel = (type) => {
        if (type?.includes('오전') || type?.includes('오후')) {
            return type; // 반차는 그대로 표시
        }
        
        switch (type) {
            case '연차':
                return '연차';
            case '특별휴가':
                return '특별';
            case '병가':
                return '병가';
            case '업무':
                return '업무';
            default:
                return type;
        }
    };
    
    const dayNumber = date.getDate();
    const isHolidayDate = holiday; // Use passed holiday prop
    const holidayName = holiday ? holiday.name : '';
    const isWeekend = isWeekendDay(date);
    
    // 전체 휴가 개수 계산 (오버플로우 표시용)
    const maxVisibleVacations = isHolidayDate ? 4 : 5;
    const overflowCount = vacations.length > maxVisibleVacations ? vacations.length - maxVisibleVacations : 0;

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
        console.log('[CalendarDay] 🖱️ 클릭 이벤트 발생:', { 
            dateString, 
            isCurrentMonth,
            vacationsCount: vacations.length,
            halfDayVacationsCount: halfDayVacations.length
        });
        
        if (!isCurrentMonth) {
            console.log('[CalendarDay] ❌ 현재 월이 아니므로 클릭 무시');
            return;
        }
        
        if (!actions || !actions.openModal) {
            console.error('[CalendarDay] ❌ actions.openModal이 없습니다!', actions);
            return;
        }

        console.log('[CalendarDay] ✅ 클릭 처리 시작...');
        
        // 해당 날짜에 휴가가 있으면 일자별 휴가 보기 모달, 없으면 휴가 추가 모달
        let allVacationsForDate = [...vacations, ...halfDayVacations];
        
        // 현재 날짜가 연속휴가에 포함되어 있는지 확인
        // 연속휴가 막대바가 덮고 있는 날짜도 해당 연휴 정보를 보여줘야 함
        if (allVacationsForDate.length === 0) {
            // 각 직원의 연속휴가를 확인
            employees.forEach(employee => {
                const consecutiveGroup = getConsecutiveGroupForDate(date, employee.id);
                
                if (consecutiveGroup && consecutiveGroup.isConsecutive) {
                    // 현재 날짜가 이 연속휴가 기간에 포함되는지 확인
                    const startDate = new Date(consecutiveGroup.startDate);
                    const endDate = new Date(consecutiveGroup.endDate);
                    const currentDate = new Date(dateString);
                    
                    if (currentDate >= startDate && currentDate <= endDate) {
                        // 해당 날짜의 실제 휴가 정보 찾기
                        const vacationForThisDate = consecutiveGroup.vacations.find(v => v.date === dateString);
                        if (vacationForThisDate) {
                            allVacationsForDate.push(vacationForThisDate);
                        }
                    }
                }
            });
        }
        
        console.log('[CalendarDay] 📊 휴가 데이터 분석:', {
            totalVacations: allVacationsForDate.length,
            vacationDetails: allVacationsForDate.map(v => ({ 
                id: v.id, 
                employeeId: v.employeeId, 
                type: v.type 
            }))
        });

        if (allVacationsForDate.length > 0) {
            console.log('[CalendarDay] 📅 일자별 휴가 모달 열기...');
            try {
                actions.openModal('dayVacations', {
                    date: dateString,
                    vacations: allVacationsForDate,
                    employees: employees
                });
                console.log('[CalendarDay] ✅ 일자별 휴가 모달 오픈 완료');
            } catch (error) {
                console.error('[CalendarDay] ❌ 일자별 휴가 모달 오픈 실패:', error);
            }
        } else {
            console.log('[CalendarDay] ➕ 빈 일자 클릭 - 휴가 추가 모달 열기:', {
                dateString,
                actualDate: date.toISOString().split('T')[0],
                isCurrentMonth
            });
            try {
                actions.openModal('addVacation', {
                    date: dateString,
                    employee: null,
                    type: '연차'
                });
                console.log('[CalendarDay] ✅ 휴가 추가 모달 오픈 완료');
            } catch (error) {
                console.error('[CalendarDay] ❌ 휴가 추가 모달 오픈 실패:', error);
            }
        }
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

    // 셀 높이 계산 (휴가 개수에 따라 동적 조절, 최대 6개까지만 표시)
    const calculateCellHeight = () => {
        const baseHeight = 100; // 기본 최소 높이
        const barHeight = 22; // 각 휴가 막대바 높이 + 여백
        const headerHeight = 40; // 날짜 헤더 높이
        const padding = 12; // 여백
        const halfDayHeight = 20; // 반차 높이
        const maxVisibleVacations = 5; // 최대 표시할 휴가 개수 (구글 캘린더처럼)
        
        // 일반 휴가 개수 (연차, 특별, 병가, 업무)
        const fullDayCount = vacations.filter(v => !['오전', '오후'].includes(v.type)).length;
        
        // 반차가 있는 경우 한 줄로 처리 (오전, 오후 합쳐서)
        const hasHalfDay = halfDayVacations.length > 0 ? 1 : 0;
        
        const totalBars = fullDayCount + hasHalfDay;
        
        // 최대 5개까지만 표시하고 나머지는 +숫자로 표시
        const visibleBars = Math.min(totalBars, maxVisibleVacations);
        const requiredHeight = headerHeight + (visibleBars * barHeight) + (hasHalfDay * halfDayHeight) + padding;
        
        // +숫자 표시를 위한 추가 높이
        const hasOverflow = totalBars > maxVisibleVacations;
        const overflowHeight = hasOverflow ? 20 : 0;
        
        return Math.max(baseHeight, requiredHeight + overflowHeight);
    };

    // 반차 연속휴가 처리 함수
    const renderHalfDayVacationBar = (vacation, index, isOtherHalfVisible) => {
        const employeeColor = getEmployeeColor(vacation.employeeId);
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
        
        // 연속휴가에 포함된 반차는 별도로 렌더링하지 않음 (중복 방지)
        if (consecutiveGroup && consecutiveGroup.isConsecutive) {
            // 연속휴가가 반차로 시작하는 경우, 해당 반차는 연속휴가 막대바에 포함되므로 렌더링하지 않음
            const startDateVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.startDate);
            if (startDateVacation && ['오전', '오후'].includes(startDateVacation.type)) {
                // 현재 반차가 연속휴가의 시작 날짜에 있는 반차라면 렌더링하지 않음
                if (vacation.date === consecutiveGroup.startDate && vacation.type === startDateVacation.type) {
                    return null;
                }
            }
        }
        
        return (
            <div
                key={`${vacation.type}-${vacation.employeeId}-${index}`}
                className={`half-vacation-bar ${vacation.type === '오전' ? 'morning' : 'afternoon'}`}
                style={{ 
                    backgroundColor: employeeColor,
                    borderColor: employeeColor,
                    justifyContent: vacation.type === '오전' ? 'flex-start' : 'flex-end',
                    textAlign: vacation.type === '오전' ? 'left' : 'right'
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

        // 구글 캘린더 스타일 바 디자인
        let barStyle = {
            backgroundColor: employeeColor,
            border: 'none',
            boxShadow: 'none',
            fontSize: '11px',
            fontWeight: '500',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
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
                    left: '0px',
                    top: `${topPosition}px`,
                    zIndex: 15,
                    width: '100%',
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
                
                // 모바일에서는 연속휴가도 단일 셀 내에서만 표시하도록 수정
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    // 모바일에서는 단일 셀 크기로 제한
                    const topPosition = (index * 22) + 6;
                    
                    positionStyle = {
                        position: 'absolute',
                        left: '0px',
                        top: `${topPosition}px`,
                        zIndex: 20,
                        width: '100%',
                        height: '18px',
                        overflow: 'hidden', // 셀 경계 넘어가지 않도록
                        borderRadius: '8px',
                    };
                } else {
                    // 데스크톱에서는 시작일에서만 전체 연휴 기간에 걸친 막대바 표시
                    const effectiveDayWidth = dayWidth && dayWidth > 0 ? dayWidth : 140;
                    
                    // 시작일에서만 연휴 막대바 렌더링 (전체 기간에 걸쳐)
                    const totalBarWidth = effectiveWidth * effectiveDayWidth;
                    const startLeftPosition = startOffset * effectiveDayWidth;
                    
                    const topPosition = (index * 22) + 6;
                    
                    positionStyle = {
                        position: 'absolute',
                        left: `${startLeftPosition}px`,
                        top: `${topPosition}px`,
                        zIndex: 20,
                        width: `${totalBarWidth}px`,
                        height: '18px',
                        overflow: 'visible',
                        borderRadius: '4px',
                    };
                }
                extraClass = 'consecutive-bar';
            }
        } else {
            // 단일 휴가도 absolute 위치로 설정하여 정렬 순서 보장
            const topPosition = (index * 22) + 6;
            
            positionStyle = {
                position: 'absolute',
                left: '0px',
                top: `${topPosition}px`,
                zIndex: 15, // 연속휴가보다 낮은 z-index
                width: '100%',
                height: '18px',
                borderRadius: '4px',
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
                    <div className="google-vacation-content" style={{ 
                        padding: '2px 6px', 
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '500',
                        lineHeight: '14px',
                        textAlign: 'center'
                    }}>
                        {employee ? employee.name : '알 수 없음'} {new Date(consecutiveGroup.startDate).getDate()}일~{new Date(consecutiveGroup.endDate).getDate()}일 연휴
                    </div>
                ) : (
                    <div className="google-vacation-content" style={{ 
                        padding: '2px 6px', 
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '500',
                        lineHeight: '14px',
                        textAlign: 'center'
                    }}>
                        {employee ? employee.name : '알 수 없음'} {getVacationTypeLabel(vacation.type)}
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
                {/* 오버플로우 표시를 날짜 번호 오른쪽에 직접 배치 */}
                {overflowCount > 0 && (
                    <span 
                        className="header-overflow-indicator"
                        style={{
                            color: '#5f6368',
                            background: 'rgba(95, 99, 104, 0.1)',
                            padding: '1px 4px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            border: '1px solid rgba(95, 99, 104, 0.2)',
                            marginLeft: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const halfDayVacations = vacations.filter(v => ['오전', '오후'].includes(v.type));
                            const allVacationsForDate = [...vacations, ...halfDayVacations];
                            actions.openModal('dayVacations', {
                                date: dateString,
                                vacations: allVacationsForDate,
                                employees: employees
                            });
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(95, 99, 104, 0.15)';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(95, 99, 104, 0.1)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                        title={`${overflowCount}개의 추가 휴가가 있습니다. 클릭하여 모두 보기`}
                    >
                        +{overflowCount}
                    </span>
                )}
            </div>

            <div className="day-content">
                {/* 일반 휴가 표시 (연차, 특별, 병가, 업무) + 연속휴가 막대바 */}
                <div className="full-day-vacations">
                    {(() => {
                        let fullDayVacations = vacations.filter(v => !['오전', '오후'].includes(v.type));

                        // 반차로 시작하는 연속휴가 처리: 해당 날짜에 연휴 막대바를 렌더링하기 위해 가상 휴가 추가
                        // halfDayVacations prop을 직접 사용 (vacations는 fullDay만 포함)
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
                        
                        
                        // Calendar.jsx에서 이미 트랙이 할당된 상태이므로 재정렬만 수행
                        const sorted = fullDayVacations.sort((a, b) => {
                            // trackIndex 기준으로 정렬 (Calendar.jsx에서 할당된 순서 유지)
                            return (a.trackIndex || 0) - (b.trackIndex || 0);
                        });
                        
                        // 공휴일이 있으면 휴가 표시 개수를 줄임 (공휴일 표시 공간 확보)
                        const maxVisibleVacations = isHolidayDate ? 4 : 5;
                        const visibleVacations = sorted.slice(0, maxVisibleVacations);
                        const hiddenCount = sorted.length - maxVisibleVacations;
                        
                        const rendered = visibleVacations.map((vacation) => {
                            // Calendar.jsx에서 할당된 trackIndex 사용
                            return renderVacationBar(vacation, vacation.trackIndex || 0);
                        }).filter(Boolean); // null 제거
                        
                        // 기존 DOM 조작 방식 제거 - 이제 헤더에서 직접 렌더링됨
                        
                        return rendered;
                    })()}
                </div>

                {/* 반차 렌더링 (좌우로 구분) */}
                {(() => {
                    // halfDayVacations prop을 직접 사용 (vacations에서 다시 필터링하지 않음)
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
                    
                    // Calendar.jsx에서 할당된 trackIndex 사용하여 최대 트랙 인덱스 계산
                    const currentFullDayVacations = vacations.filter(v => !['오전', '오후'].includes(v.type));
                    
                    let maxTrackIndex = -1;
                    currentFullDayVacations.forEach(vacation => {
                        maxTrackIndex = Math.max(maxTrackIndex, vacation.trackIndex || 0);
                    });
                    
                    // 반차 연속휴가가 있는 경우의 위치 계산 - 트랙 시스템 고려
                    let halfDayStartTop;
                    if (hasConsecutiveHalfDay) {
                        // 반차 연속휴가가 있으면 모든 트랙 아래에 배치
                        halfDayStartTop = ((maxTrackIndex + 1) * 22) + 6;
                    } else {
                        // 일반 반차는 모든 트랙 아래에 배치
                        halfDayStartTop = ((maxTrackIndex + 1) * 22) + 6;
                    }
                    // z-index 조정: 반차 연속휴가는 연차 막대바 아래에 배치
                    const halfDayZIndex = hasConsecutiveHalfDay ? 18 : 10;
                    
                    if (morningVacations.length === 0 && afternoonVacations.length === 0) {
                        return null;
                    }

                    return (
                        <div 
                            className="half-day-container"
                            style={{
                                position: 'absolute',
                                top: `${halfDayStartTop}px`,
                                left: '0px',
                                right: '0px',
                                width: '100%',
                                zIndex: halfDayZIndex,
                                overflow: 'hidden'
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
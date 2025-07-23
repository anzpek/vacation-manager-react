// MobileCalendar.jsx - 모바일 전용 달력 컴포넌트
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { CalendarSkeleton } from '../Common/Skeleton';
import holidayService from '../../services/holidayService';
import './MobileCalendar.css';

const MobileCalendarDay = ({ date, isCurrentMonth, isToday, dayOfWeek, vacations, holiday, getConsecutiveGroupForDate, employees }) => {
  const { actions } = useVacation();
  const dayNumber = date.getDate();
  
  // PC 버전과 동일한 셀 높이 계산 (휴가 개수에 따라 동적 조절)
  const calculateCellHeight = () => {
    const baseHeight = 85; // 기본 최소 높이
    const barHeight = 18; // 각 휴가 막대바 높이 + 여백
    const headerHeight = 20; // 날짜 헤더 높이
    const padding = 8; // 여백
    const halfDayHeight = 16; // 반차 높이
    
    // 일반 휴가 개수 (연차, 특별, 병가, 업무)
    const fullDayCount = vacations.fullDay.filter(v => !['오전', '오후'].includes(v.type)).length;
    
    // 반차가 있는 경우 한 줄로 처리 (오전, 오후 합쳐서)
    const hasHalfDay = vacations.halfDay.length > 0 ? 1 : 0;
    
    const totalBars = fullDayCount + hasHalfDay;
    const requiredHeight = headerHeight + (totalBars * barHeight) + (hasHalfDay * halfDayHeight) + padding;
    
    return Math.max(baseHeight, requiredHeight);
  };
  
  const cellHeight = calculateCellHeight();
  
  // 직원 색상 가져오기 함수
  const getEmployeeColor = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return '#6B7280'; // 기본 회색으로 표시
    }
    return employee.color || '#4285f4'; // 기본 파란색
  };
  
  // 날짜 클릭 핸들러
  const handleDayClick = () => {
    if (!isCurrentMonth) return;
    
    const dateString = formatDateToYYYYMMDD(date);
    
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
    const dateString = formatDateToYYYYMMDD(date);
    const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
    
    actions.openModal('editVacation', {
      date: dateString,
      vacation: vacation,
      employee: employee,
      consecutiveGroup: consecutiveGroup
    });
  };
  
  const dayClasses = [
    'mobile-calendar-day',
    !isCurrentMonth && 'other-month',
    isToday && 'today',
    dayOfWeek === 0 && 'sunday',
    dayOfWeek === 6 && 'saturday',
    holiday && 'holiday'
  ].filter(Boolean).join(' ');

  // PC 버전과 동일한 막대바 렌더링 로직
  const renderVacationBars = () => {
    const renderedBars = [];
    
    // 모바일 그리드 셀 너비 계산 (일/토요일 좁게, 평일 넓게 고려)
    const mobileCalendarGrid = document.querySelector('.mobile-calendar-grid');
    const totalGridWidth = mobileCalendarGrid ? mobileCalendarGrid.clientWidth - 6 : 350;
    
    // 그리드 비율: 0.8fr 1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 0.8fr
    const totalFractions = 0.8 + 1.2 + 1.2 + 1.2 + 1.2 + 1.2 + 0.8; // 7.6fr
    const baseCellWidth = totalGridWidth / totalFractions;
    
    // 각 요일별 너비 계산
    const getCellWidthByDay = (dayOfWeek) => {
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 일요일, 토요일
        return baseCellWidth * 0.8;
      } else { // 월~금요일
        return baseCellWidth * 1.2;
      }
    };
    
    // 현재 날짜의 주에서의 위치 계산
    const currentDayOfWeek = date.getDay();
    const mobileCellWidth = getCellWidthByDay(currentDayOfWeek);
    
    // fullDay 휴가들을 PC 버전과 동일한 순서로 렌더링
    vacations.fullDay.forEach((vacation, index) => {
      const employeeColor = getEmployeeColor(vacation.employeeId);
      const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
      
      const isStartOfGroup = consecutiveGroup && consecutiveGroup.startDate === formatDateToYYYYMMDD(date);
      const isEndOfGroup = consecutiveGroup && consecutiveGroup.endDate === formatDateToYYYYMMDD(date);
      const isMiddleOfGroup = consecutiveGroup && !isStartOfGroup && !isEndOfGroup;
      
      // PC 버전과 동일한 렌더링 조건
      if (consecutiveGroup && consecutiveGroup.isConsecutive) {
        // 연휴 데이터 무결성 체크
        if (!consecutiveGroup.vacations || consecutiveGroup.vacations.length === 0) {
          return;
        }
        
        // 현재 날짜가 이 직원의 연속휴가에 실제로 포함되는지 확인
        const hasVacationOnThisDate = consecutiveGroup.vacations.some(v => 
          v.date === formatDateToYYYYMMDD(date) && v.employeeId === vacation.employeeId
        );
        
        if (!hasVacationOnThisDate) {
          return;
        }
        
        // 연속휴가는 시작일에만 막대바를 렌더링하되, 여러 셀에 걸쳐 표시
        if (!isStartOfGroup) {
          return;
        }
      }
      
      // 연휴가 아닌 경우: 정상적으로 렌더링 (단독 휴가 포함)
      if (!consecutiveGroup || !consecutiveGroup.isConsecutive) {
        // Calendar.jsx에서 온 가상 휴가는 렌더링하지 않음
        if (vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) {
          return;
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
      
      if (consecutiveGroup && consecutiveGroup.isConsecutive) {
        // 연휴 막대바 너비 계산
        const holidayStartDate = new Date(consecutiveGroup.startDate);
        const holidayEndDate = new Date(consecutiveGroup.endDate);
        
        // 시작과 끝 휴가 정보
        const startVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.startDate);
        const endVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.endDate);
        
        // 연휴 막대바 계산
        const isStartHalfDay = ['오전', '오후'].includes(startVacation?.type);
        const isEndHalfDay = ['오전', '오후'].includes(endVacation?.type);
        
        // 막대바 시작 위치 (시작일이 오후반차면 50%부터 시작)
        const startOffset = (isStartHalfDay && startVacation.type === '오후') ? 0.5 : 0;
        
        // 막대바 끝 위치 (끝일이 오전반차면 50%까지만)
        const endOffset = (isEndHalfDay && endVacation.type === '오전') ? 0.5 : 1;
        
        // 전체 일수 계산
        const totalDays = (holidayEndDate.getTime() - holidayStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
        const effectiveWidth = (totalDays - 1) + endOffset - startOffset;
        
        const duration = effectiveWidth;
        
        // PC처럼 전체 연속휴가 기간을 모바일에서도 표시 (다음 주까지 확장)
        const totalDuration = duration;
        const thisWeekBarLength = Math.max(totalDuration, 1);
        
        // PC처럼 정확한 연속휴가 막대바 너비 계산 (여러 셀에 걸쳐 표시)
        let totalBarWidth = 0;
        let currentCalcDate = new Date(consecutiveGroup.startDate);
        const endCalcDate = new Date(consecutiveGroup.endDate);
        
        // 연속휴가 기간 동안 각 날짜의 셀 너비를 누적 계산
        while (currentCalcDate <= endCalcDate) {
          const dayOfWeek = currentCalcDate.getDay();
          totalBarWidth += getCellWidthByDay(dayOfWeek);
          currentCalcDate.setDate(currentCalcDate.getDate() + 1);
        }
        
        // 시작 오프셋과 끝 오프셋 적용
        const startOffsetWidth = startOffset * getCellWidthByDay(new Date(consecutiveGroup.startDate).getDay());
        const endOffsetWidth = (1 - endOffset) * getCellWidthByDay(new Date(consecutiveGroup.endDate).getDay());
        
        const effectiveBarWidth = totalBarWidth - startOffsetWidth - endOffsetWidth - 8;
        barWidth = `${Math.max(effectiveBarWidth, mobileCellWidth - 8)}px`;
        
        // 연휴 막대바 시작 위치 계산
        const leftPosition = startOffset * getCellWidthByDay(new Date(consecutiveGroup.startDate).getDay());
        
        const topPosition = (vacation.trackIndex * 18) + 6;
        
        positionStyle = {
          position: 'absolute',
          left: `${4 + leftPosition}px`,
          top: `${topPosition}px`,
          zIndex: 20, // PC와 동일한 연휴 z-index
          width: barWidth,
          height: '16px',
          overflow: 'visible',
          borderRadius: '8px',
          pointerEvents: 'auto', // 클릭 가능하게 유지
        };
        extraClass = 'consecutive-bar';
      } else {
        // 단일 휴가도 absolute 위치로 설정하여 정렬 순서 보장
        const topPosition = (vacation.trackIndex * 18) + 6;
        
        positionStyle = {
          position: 'absolute',
          left: '4px',
          top: `${topPosition}px`,
          zIndex: 15, // PC와 동일한 단일휴가 z-index
          width: 'calc(100% - 8px)',
          height: '16px',
          borderRadius: '8px',
        };
      }

      // 연속휴가인지 확인하여 텍스트 형식 결정
      const isConsecutiveVacation = consecutiveGroup && consecutiveGroup.isConsecutive;
      
      renderedBars.push(
        <div
          key={`vacation-${vacation.employeeId}-${vacation.type}-${index}`}
          className={`mobile-vacation-bar ${extraClass}`}
          style={{ ...barStyle, ...positionStyle }}
          onClick={(e) => {
            // 가상 휴가인 경우 원본 휴가 정보로 클릭 처리
            if ((vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) && consecutiveGroup && consecutiveGroup.vacations.length > 0) {
              const originalVacation = consecutiveGroup.vacations.find(v => v.date === formatDateToYYYYMMDD(date));
              if (originalVacation) {
                handleVacationClick(e, originalVacation);
                return;
              }
            }
            handleVacationClick(e, vacation);
          }}
          title={`${vacation.employeeName} - ${(vacation.isVirtualForConsecutive || vacation.isVirtualForConsecutiveRender) ? '연휴' : vacation.type}${vacation.description ? ` (${vacation.description})` : ''}`}
        >
          {isConsecutiveVacation ? (
            <div className="consecutive-vacation-content">
              <span className="mobile-vacation-text">
                {vacation.employeeName} {new Date(consecutiveGroup.startDate).getDate()}일 ~ {new Date(consecutiveGroup.endDate).getDate()}일 연휴
              </span>
            </div>
          ) : (
            <div className="single-vacation-content">
              <span className="mobile-vacation-text">
                {vacation.employeeName} {vacation.type}
              </span>
            </div>
          )}
        </div>
      );
    });
    
    return renderedBars;
  };

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={dayClasses} onClick={handleDayClick} style={{ minHeight: `${cellHeight}px` }}>
      <div className="mobile-day-header">
        <div className="mobile-day-number">{dayNumber}</div>
        {holiday && <div className="mobile-holiday-indicator">🎆</div>}
      </div>
      {holiday && <div className="mobile-holiday-name">{holiday.name}</div>}
      
      <div className="mobile-vacations">
        {renderVacationBars()}
        
        {/* PC 버전과 동일한 반차 표시 - 오전/오후 분리 */}
        {(() => {
          const morningVacations = vacations.halfDay.filter(v => v.type === '오전');
          const afternoonVacations = vacations.halfDay.filter(v => v.type === '오후');
          
          // 반차로 시작하는 연속휴가가 있는지 확인
          const hasConsecutiveHalfDay = [...morningVacations, ...afternoonVacations].some(vacation => {
            const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
            if (!consecutiveGroup || !consecutiveGroup.isConsecutive) return false;
            
            const startDateVacation = consecutiveGroup.vacations.find(v => v.date === consecutiveGroup.startDate);
            const isHalfDayStart = startDateVacation && ['오전', '오후'].includes(startDateVacation.type);
            const isStartOfGroup = consecutiveGroup.startDate === formatDateToYYYYMMDD(date);
            
            return isHalfDayStart && isStartOfGroup;
          });
          
          // 일반 휴가 개수를 계산하여 반차 시작 위치 결정
          const visibleFullDayCount = vacations.fullDay.filter(v => {
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
          
          const halfDayStartTop = hasConsecutiveHalfDay ? 6 : (visibleFullDayCount * 18) + 6;
          const halfDayZIndex = hasConsecutiveHalfDay ? 20 : 10;
          
          if (morningVacations.length === 0 && afternoonVacations.length === 0) {
            return null;
          }

          return (
            <div 
              className="mobile-half-day-container"
              style={{
                position: 'absolute',
                top: `${halfDayStartTop}px`,
                left: '4px',
                width: 'calc(100% - 8px)',
                zIndex: halfDayZIndex,
                display: 'flex',
                flexDirection: 'row',
                gap: '2px'
              }}
            >
              {/* 오전반차 - 좌측에 표시 */}
              <div className="mobile-morning-half" style={{ width: '48%', display: 'flex', justifyContent: 'flex-start' }}>
                {morningVacations.map((vacation, index) => {
                  const employeeColor = getEmployeeColor(vacation.employeeId);
                  const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
                  
                  // 반차 연속휴가 처리
                  if (consecutiveGroup && consecutiveGroup.isConsecutive) {
                    const isStartOfGroup = consecutiveGroup.startDate === formatDateToYYYYMMDD(date);
                    const isEndOfGroup = consecutiveGroup.endDate === formatDateToYYYYMMDD(date);
                    
                    // 연속휴가의 시작이나 끝일의 반차는 연휴 막대바와 함께 렌더링되므로 개별 반차는 표시하지 않음
                    if (isStartOfGroup || isEndOfGroup) {
                      return null;
                    }
                  }
                  
                  return (
                    <div 
                      key={`morning-${vacation.employeeId}-${index}`}
                      className={`mobile-half-day-item mobile-morning-item`}
                      style={{
                        backgroundColor: employeeColor,
                        borderColor: employeeColor,
                        width: '18px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      title={`${vacation.employeeName}: ${vacation.type}`}
                      onClick={(e) => handleVacationClick(e, vacation)}
                    >
                      {vacation.employeeName.charAt(0)}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              
              {/* 오후반차 - 우측에 표시 */}
              <div className="mobile-afternoon-half" style={{ width: '48%', display: 'flex', justifyContent: 'flex-end' }}>
                {afternoonVacations.map((vacation, index) => {
                  const employeeColor = getEmployeeColor(vacation.employeeId);
                  const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
                  
                  // 반차 연속휴가 처리
                  if (consecutiveGroup && consecutiveGroup.isConsecutive) {
                    const isStartOfGroup = consecutiveGroup.startDate === formatDateToYYYYMMDD(date);
                    const isEndOfGroup = consecutiveGroup.endDate === formatDateToYYYYMMDD(date);
                    
                    // 연속휴가의 시작이나 끝일의 반차는 연휴 막대바와 함께 렌더링되므로 개별 반차는 표시하지 않음
                    if (isStartOfGroup || isEndOfGroup) {
                      return null;
                    }
                  }
                  
                  return (
                    <div 
                      key={`afternoon-${vacation.employeeId}-${index}`}
                      className={`mobile-half-day-item mobile-afternoon-item`}
                      style={{
                        backgroundColor: employeeColor,
                        borderColor: employeeColor,
                        width: '18px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      title={`${vacation.employeeName}: ${vacation.type}`}
                      onClick={(e) => handleVacationClick(e, vacation)}
                    >
                      {vacation.employeeName.charAt(0)}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const MobileCalendar = ({ holidays, filteredEmployees }) => {
  const { state, actions } = useVacation();
  const { 
    selectedYear = new Date().getFullYear(), 
    selectedMonth = new Date().getMonth(), 
    vacations = [], 
    employees = [] 
  } = state;

  const [isLoading, setIsLoading] = useState(true);

  // 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth, employees, vacations]);

  const currentDate = new Date(selectedYear, selectedMonth);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
  const calendarDays = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHolidayForDate = (date) => {
    const dateString = holidayService.formatDate(date);
    return holidays.find(holiday => holiday.date === dateString) || null;
  };

  // 연속휴가 그룹 계산 (PC버전과 동일한 로직)
  const getConsecutiveVacations = useMemo(() => {
    const consecutiveGroups = [];
    
    filteredEmployees.forEach(employee => {
      const employeeVacations = vacations
        .filter(v => v.employeeId === employee.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      let tempGroups = [];
      let currentGroup = null;

      employeeVacations.forEach((vacation, index) => {
        const currentDate = new Date(vacation.date);
        
        if (!currentGroup) {
          currentGroup = {
            employeeId: employee.id,
            employeeName: employee.name,
            startDate: vacation.date,
            endDate: vacation.date,
            type: vacation.type,
            vacations: [vacation],
            isConsecutive: false,
          };
        } else {
          const lastDate = new Date(currentGroup.endDate);
          const nextDay = new Date(lastDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          if (currentDate.getTime() === nextDay.getTime()) {
            currentGroup.endDate = vacation.date;
            currentGroup.vacations.push(vacation);
            currentGroup.isConsecutive = true;
          } else {
            tempGroups.push({ ...currentGroup, vacations: [...currentGroup.vacations] });
            currentGroup = {
              employeeId: employee.id,
              employeeName: employee.name,
              startDate: vacation.date,
              endDate: vacation.date,
              type: vacation.type,
              vacations: [vacation],
              isConsecutive: false
            };
          }
        }
        
        if (index === employeeVacations.length - 1) {
          tempGroups.push({ ...currentGroup, vacations: [...currentGroup.vacations] });
        }
      });

      tempGroups.forEach(group => {
        if (group.vacations.length > 1 && group.isConsecutive) {
          consecutiveGroups.push(group);
        }
      });
    });
    
    return consecutiveGroups;
  }, [vacations, filteredEmployees, employees]);

  const getConsecutiveGroupForDate = (date, employeeId) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const consecutiveGroups = getConsecutiveVacations;

    return consecutiveGroups.find(group => 
      group &&
      group.employeeId === employeeId &&
      dateStr >= group.startDate && 
      dateStr <= group.endDate
    );
  };

  const getVacationsForDate = (date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    
    // 필터된 직원들의 휴가만 가져오기
    const filteredEmployeeIds = filteredEmployees.map(emp => emp.id);
    let allVacationsForThisDate = vacations.filter(vacation => 
      vacation.date === dateStr && filteredEmployeeIds.includes(vacation.employeeId)
    );
    
    // 1. Full-day vacations and half-day vacations separation
    let fullDayVacations = allVacationsForThisDate.filter(v => !['오전', '오후'].includes(v.type));
    const halfDayVacations = allVacationsForThisDate.filter(v => ['오전', '오후'].includes(v.type));

    // 2. PC 버전과 동일한 반차 연속휴가 처리 로직
    halfDayVacations.forEach(halfVacation => {
      const consecutiveGroup = getConsecutiveGroupForDate(date, halfVacation.employeeId);
      
      if (consecutiveGroup && consecutiveGroup.isConsecutive) {
        const isStartOfGroup = consecutiveGroup.startDate === dateStr;
        
        // 연속휴가 그룹의 모든 휴가가 현재 휴가 데이터에 존재하는지 재확인
        const isValidConsecutive = consecutiveGroup.vacations.every(v => {
          const vacationExists = vacations.some(actualV => 
            actualV.id === v.id &&
            actualV.date === v.date && 
            actualV.employeeId === v.employeeId
          );
          return vacationExists;
        });
        
        // 연속휴가 그룹의 최소 길이 확인 (2일 이상)
        const hasMinimumLength = consecutiveGroup.vacations.length >= 2;
        
        // 이미 해당 직원의 종일 휴가가 있는지 확인
        const hasExistingFullDay = fullDayVacations.some(v => v.employeeId === halfVacation.employeeId);
        
        if (isStartOfGroup && isValidConsecutive && hasMinimumLength && !hasExistingFullDay) {
          // 가상 fullDay 휴가를 추가 (연휴 막대바 렌더링용)
          fullDayVacations.push({
            ...halfVacation,
            type: '연휴', // 가상 타입
            isVirtualForConsecutiveRender: true // 가상 휴가 표시
          });
        }
      }
    });

    // 3. PC 버전과 동일한 정렬 로직 (연속휴가 기간 기준 내림차순)
    fullDayVacations.sort((a, b) => {
      const groupA = getConsecutiveGroupForDate(date, a.employeeId);
      const groupB = getConsecutiveGroupForDate(date, b.employeeId);

      // 연속휴가가 있으면 실제 일수 계산, 없으면 단일휴가(1일)로 처리
      const durationA = groupA ? 
        (new Date(groupA.endDate).getTime() - new Date(groupA.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
        1; // 단일 휴가는 1일
      const durationB = groupB ? 
        (new Date(groupB.endDate).getTime() - new Date(groupB.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
        1; // 단일 휴가는 1일

      if (durationA !== durationB) {
        return durationB - durationA; // 긴 연휴가 먼저 (상단에 표시)
      }
      return a.employeeId - b.employeeId; // 일수가 같으면 직원 ID순
    });

    // 4. PC 버전과 동일한 트랙 할당 시스템
    const tracks = []; // Stores the end date of the vacation on each track
    const fullDayVacationsWithTracks = [];

    fullDayVacations.forEach(vacation => {
      const consecutiveGroup = getConsecutiveGroupForDate(date, vacation.employeeId);
      const vacationEndDate = consecutiveGroup ? new Date(consecutiveGroup.endDate) : new Date(vacation.date);

      let assignedTrack = -1;
      for (let i = 0; i < tracks.length; i++) {
        // If the current track's last vacation ends before the current vacation starts, use this track
        if (!tracks[i] || new Date(tracks[i]) < new Date(vacation.date)) {
          assignedTrack = i;
          break;
        }
      }

      if (assignedTrack === -1) {
        assignedTrack = tracks.length; // Assign a new track
      }
      tracks[assignedTrack] = vacationEndDate; // Update the track's end date
      fullDayVacationsWithTracks.push({ ...vacation, trackIndex: assignedTrack });
    });

    // 5. Filter based on selected employees
    const filterVacations = (vacationList) => {
      return vacationList.filter(vacation => {
        const employee = employees.find(emp => emp.id === vacation.employeeId);
        
        if (!employee) return false;
        
        // filteredEmployees가 없거나 빈 배열이면 모든 휴가 표시
        if (!filteredEmployees || filteredEmployees.length === 0) {
          return true;
        }
        return filteredEmployees.some(emp => emp.id === employee.id);
      });
    };
    
    return {
      fullDay: filterVacations(fullDayVacationsWithTracks).map(v => ({
        ...v,
        employeeName: employees.find(emp => emp.id === v.employeeId)?.name || '알 수 없음'
      })),
      halfDay: filterVacations(halfDayVacations).map(v => ({
        ...v,
        employeeName: employees.find(emp => emp.id === v.employeeId)?.name || '알 수 없음'
      }))
    };
  };

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="mobile-calendar-container">
      {/* 요일 헤더 */}
      <div className="mobile-weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div 
            key={day} 
            className={`mobile-weekday ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="mobile-calendar-grid">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === new Date().toDateString();
          const dayOfWeek = date.getDay();
          const dayVacations = getVacationsForDate(date);
          const holiday = getHolidayForDate(date);
          
          return (
            <MobileCalendarDay
              key={index}
              date={date}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              dayOfWeek={dayOfWeek}
              vacations={dayVacations}
              holiday={holiday}
              getConsecutiveGroupForDate={getConsecutiveGroupForDate}
              employees={employees}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MobileCalendar;
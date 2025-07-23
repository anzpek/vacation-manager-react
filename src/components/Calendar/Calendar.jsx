import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import CalendarDay from './CalendarDay';
import { CalendarSkeleton } from '../Common/Skeleton';
import holidayService from '../../services/holidayService';

// 모바일 감지 hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const Calendar = ({ holidays, filteredEmployees }) => {
  const vacationContext = useVacation();
  const { state = {}, actions } = vacationContext || {};
  const { 
    selectedYear = new Date().getFullYear(), 
    selectedMonth = new Date().getMonth(), 
    vacations = [], 
    employees = [] 
  } = state;

  const dayRef = useRef(null);
  const [dayWidth, setDayWidth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (dayRef.current) {
      setDayWidth(dayRef.current.offsetWidth);
    }
  }, [selectedYear, selectedMonth]); // 월이 변경될 때마다 너비 재측정

  // 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // 데이터 로딩 시뮬레이션

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

  // 연속휴가 그룹 계산 - 매번 새로 계산하여 실시간 업데이트
  const getConsecutiveVacations = useMemo(() => {
    const consecutiveGroups = [];
    
    console.log('[Calendar] 🔄 연속휴가 그룹 재계산 시작');
    console.log('[Calendar] 📊 현재 휴가 데이터:', vacations.length, '개');
    console.log('[Calendar] 👥 필터된 직원 수:', filteredEmployees.length, '명');
    
    // 필터된 직원들의 휴가 데이터만을 기반으로 연속휴가 그룹 재계산
    filteredEmployees.forEach(employee => {
      const employeeVacations = vacations
        .filter(v => v.employeeId === employee.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
        
      if (employeeVacations.length > 0) {
        console.log(`[Calendar] 👤 ${employee.name} (ID: ${employee.id}) 휴가:`, employeeVacations.map(v => ({ date: v.date, type: v.type })));
      }


      let tempGroups = [];
      let currentGroup = null;

      employeeVacations.forEach((vacation, index) => {
        const currentDate = new Date(vacation.date);
        
        if (!currentGroup) {
          // 첫 번째 휴가 - 새 그룹 시작
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
          
          // 다음 날짜가 연속되는지 확인
          if (currentDate.getTime() === nextDay.getTime()) {
            // 연속됨 - 현재 그룹에 추가
            currentGroup.endDate = vacation.date;
            currentGroup.vacations.push(vacation);
            currentGroup.isConsecutive = true;
          } else {
            // 연속이 끊김 - 현재 그룹 저장하고 새 그룹 시작
            tempGroups.push({
              ...currentGroup, 
              vacations: [...currentGroup.vacations]
            });
            
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
        
        // 마지막 휴가 처리
        if (index === employeeVacations.length - 1) {
          tempGroups.push({
            ...currentGroup, 
            vacations: [...currentGroup.vacations]
          });
        }
      });

      // 2일 이상인 연속휴가만 추가
      tempGroups.forEach(group => {
        if (group.vacations.length > 1 && group.isConsecutive) {
          console.log(`[Calendar] ✅ 연속휴가 그룹 생성: ${group.employeeName} ${group.startDate}~${group.endDate} (${group.vacations.length}일)`);
          consecutiveGroups.push(group);
        } else if (group.vacations.length === 1) {
          console.log(`[Calendar] ⚪ 단일휴가: ${group.employeeName} ${group.startDate} ${group.type}`);
        }
      });
    });
    
    
    return consecutiveGroups;
  }, [vacations, filteredEmployees]);

  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getConsecutiveGroupForDate = (date, employeeId) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const consecutiveGroups = getConsecutiveVacations;

    const result = consecutiveGroups.find(group => 
      group && 
      group.employeeId === employeeId &&
      group.startDate && 
      group.endDate &&
      group.vacations &&
      group.vacations.length > 0 &&
      dateStr >= group.startDate && 
      dateStr <= group.endDate
    );
    
    // 간단한 검증: 해당 날짜에 실제 휴가가 있는지만 확인
    if (result) {
      const hasVacationOnDate = vacations.some(v => 
        v.date === dateStr && v.employeeId === employeeId
      );
      
      if (!hasVacationOnDate) {
        console.log(`[Calendar] ⚠️ 연속휴가 그룹에서 실제 휴가 없음: ${dateStr}, 직원 ${employeeId}`);
        return null;
      }
      
      console.log(`[Calendar] 🎯 연속휴가 그룹 찾음: ${dateStr}, 직원 ${employeeId}, 그룹 ${result.startDate}~${result.endDate}`);
    }
    
    return result;
  };

  const getHolidayForDate = (date) => {
    const dateString = holidayService.formatDate(date);
    return holidays.find(holiday => holiday.date === dateString) || null;
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

    // 🔧 핵심 수정: 반차로 시작하는 연속휴가 처리 - 더 엄격한 검증
    halfDayVacations.forEach(halfVacation => {
      const consecutiveGroup = getConsecutiveGroupForDate(date, halfVacation.employeeId);
      
      // 🔧 연속휴가 그룹이 null이면 (검증 실패) 가상 휴가를 생성하지 않음
      if (consecutiveGroup && consecutiveGroup.isConsecutive) {
        const isStartOfGroup = consecutiveGroup.startDate === dateStr;
        
        // 🔧 추가 검증: 연속휴가 그룹의 모든 휴가가 현재 휴가 데이터에 존재하는지 재확인
        const isValidConsecutive = consecutiveGroup.vacations.every(v => {
          const vacationExists = vacations.some(actualV => 
            actualV.id === v.id &&
            actualV.date === v.date && 
            actualV.employeeId === v.employeeId
          );
          return vacationExists;
        });
        
        // 🔧 연속휴가 그룹의 최소 길이 확인 (2일 이상)
        const hasMinimumLength = consecutiveGroup.vacations.length >= 2;
        
        // 🔧 이미 해당 직원의 종일 휴가가 있는지 확인
        const hasExistingFullDay = fullDayVacations.some(v => v.employeeId === halfVacation.employeeId);
        
        if (isStartOfGroup && isValidConsecutive && hasMinimumLength && !hasExistingFullDay) {
          console.log(`[Calendar] ✅ 검증된 반차 연속휴가 - 연휴 막대바 렌더링: ${dateStr} ${halfVacation.type}`);
          
          // 가상 fullDay 휴가를 추가 (연휴 막대바 렌더링용)
          fullDayVacations.push({
            ...halfVacation,
            type: '연휴', // 가상 타입
            isVirtualForConsecutiveRender: true // 가상 휴가 표시
          });
        } else {
          // 반차 연속휴가 검증 실패는 정상적인 경우 (단독 반차)
        }
      } else {
        // 반차는 단독으로도 표시되므로 검증 실패는 정상적인 경우임
      }
    });

    // 2. Sort full-day vacations by consecutive group duration (descending) BEFORE track assignment
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

    // 3. Track assignment for full-day vacations (이미 정렬된 상태)
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

    // 정렬된 순서를 유지하면서 trackIndex 할당
    // 트랙 할당 과정에서 순서가 바뀔 수 있으므로 연휴 기간 기준으로 다시 정렬
    fullDayVacationsWithTracks.sort((a, b) => {
      const groupA = getConsecutiveGroupForDate(date, a.employeeId);
      const groupB = getConsecutiveGroupForDate(date, b.employeeId);
      
      const durationA = groupA ? 
        (new Date(groupA.endDate).getTime() - new Date(groupA.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
        1;
      const durationB = groupB ? 
        (new Date(groupB.endDate).getTime() - new Date(groupB.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
        1;
      
      
      if (durationA !== durationB) {
        return durationB - durationA; // 긴 연휴가 먼저 (작은 trackIndex = 상단)
      }
      return a.employeeId - b.employeeId;
    });

    // 정렬된 순서대로 trackIndex 재할당 (0=상단, 1=중간, 2=하단)
    fullDayVacationsWithTracks.forEach((vacation, index) => {
      vacation.trackIndex = index;
      const group = getConsecutiveGroupForDate(date, vacation.employeeId);
      const duration = group ? 
        (new Date(group.endDate).getTime() - new Date(group.startDate).getTime()) / (1000 * 60 * 60 * 24) + 1 : 
        1;
    });

    // 4. Filter based on selected employees
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
      fullDay: filterVacations(fullDayVacationsWithTracks),
      halfDay: filterVacations(halfDayVacations)
    };
  };

  // 로딩 중일 때 스켈레톤 표시
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div style={{
      backgroundColor: 'var(--background-primary, white)',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '12px' : '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: '1px solid var(--border-color, #e5e7eb)'
    }}>
      {/* PC 버전 날짜 네비게이션 */}
      {!isMobile && (
        <div className="desktop-date-navigation" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: 'var(--background-secondary, #f8f9fa)',
          borderRadius: '12px',
          border: '1px solid var(--border-color, #e0e0e0)'
        }}>
          <button 
            onClick={() => actions.setDate(year, month - 1)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--background-primary, #ffffff)',
              border: '1px solid var(--border-color, #e0e0e0)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #666)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'var(--background-hover, #f0f0f0)';
              e.target.style.color = 'var(--text-primary, #1a1a1a)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'var(--background-primary, #ffffff)';
              e.target.style.color = 'var(--text-secondary, #666)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            margin: '0 20px'
          }}>
            <select 
              value={year}
              onChange={(e) => actions.setDate(parseInt(e.target.value), month)}
              style={{
                backgroundColor: 'var(--background-primary, #ffffff)',
                border: '1px solid var(--border-color, #e0e0e0)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary, #1a1a1a)',
                cursor: 'pointer',
                minWidth: '80px'
              }}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(yearOption => (
                <option key={yearOption} value={yearOption}>{yearOption}년</option>
              ))}
            </select>
            
            <select 
              value={month}
              onChange={(e) => actions.setDate(year, parseInt(e.target.value))}
              style={{
                backgroundColor: 'var(--background-primary, #ffffff)',
                border: '1px solid var(--border-color, #e0e0e0)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-primary, #1a1a1a)',
                cursor: 'pointer',
                minWidth: '80px'
              }}
            >
              {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((monthName, index) => (
                <option key={index} value={index}>{monthName}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={() => actions.setDate(year, month + 1)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--background-primary, #ffffff)',
              border: '1px solid var(--border-color, #e0e0e0)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #666)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'var(--background-hover, #f0f0f0)';
              e.target.style.color = 'var(--text-primary, #1a1a1a)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'var(--background-primary, #ffffff)';
              e.target.style.color = 'var(--text-secondary, #666)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}


      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(7, 1fr)' : 'repeat(7, 140px)',
        gap: '1px',
        marginBottom: '1px',
        justifyContent: 'center'
      }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div key={day} style={{
            padding: isMobile ? '8px 4px' : '12px',
            textAlign: 'center',
            fontWeight: '600',
            backgroundColor: 'var(--background-secondary, #f8fafc)',
            color: index === 0 ? '#dc2626' : index === 6 ? '#2563eb' : 'var(--text-primary, #374151)',
            fontSize: isMobile ? '12px' : '14px',
            border: '1px solid var(--border-color, #e5e7eb)'
          }}>
            {day}
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(7, 1fr)' : 'repeat(7, 140px)',
        gap: '1px',
        backgroundColor: 'var(--border-color, #e5e7eb)',
        justifyContent: 'center'
      }}>
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === new Date().toDateString();
          const dayOfWeek = date.getDay();
          const dayVacations = getVacationsForDate(date);
          const holiday = getHolidayForDate(date);
          
          return (
            <CalendarDay
              key={index}
              date={date}
              dateString={formatDateToYYYYMMDD(date)}
              isCurrentMonth={isCurrentMonth}
              isSunday={dayOfWeek === 0}
              isSaturday={dayOfWeek === 6}
              isToday={isToday}
              holiday={holiday}
              vacations={dayVacations.fullDay}
              halfDayVacations={dayVacations.halfDay}
              employees={filteredEmployees}
              getConsecutiveGroupForDate={getConsecutiveGroupForDate}
              dayWidth={dayWidth} // dayWidth 전달
              ref={index === 0 ? dayRef : null} // 첫 번째 CalendarDay에 ref 연결
            />
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;

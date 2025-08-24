import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import VacationModal from '../Vacation/VacationModal';
import DayVacationsModal from '../Modal/DayVacationsModal';
import AdvancedFilter from '../Filter/AdvancedFilter';
import BatchInput from '../BatchInput/BatchInput';
import EmployeeManager from '../Employee/EmployeeManager';
import Calendar from '../Calendar/Calendar';
import MobileCalendar from '../Calendar/MobileCalendar';
import PullToRefresh from '../Common/PullToRefresh';
import usePullToRefresh from '../../hooks/usePullToRefresh';
import useIsMobile from '../../hooks/useIsMobile';
import holidayService from '../../services/holidayService';
import './MainContent.css';

const MainContent = React.memo(() => {
  const vacationContext = useVacation();
  const { state = { employees: [], vacations: [], teams: [], filters: { selectedEmployees: [] } }, actions } = vacationContext || {};
  const [holidays, setHolidays] = useState([]); // 공휴일 데이터
  const isMobile = useIsMobile();

  // Pull-to-Refresh 새로고침 함수 (memoized)
  const handleRefresh = useCallback(async () => {
    try {
      // 페이지 전체 새로고침
      window.location.reload();
    } catch (error) {
      console.error('새로고침 실패:', error);
    }
  }, []);

  // Pull-to-Refresh hook 사용
  const { isPulling, pullDistance, isRefreshing, isEnabled } = usePullToRefresh(handleRefresh, 80);

  // 필터링된 직원들 (선택된 팀만) - 먼저 선언
  const filteredEmployees = useMemo(() => {
    // selectedEmployees 필터를 사용 (더 정확함)
    if (!state.filters.selectedEmployees || state.filters.selectedEmployees.length === 0) {
      return state.employees; // 모든 직원 표시로 변경
    }
    
    const filtered = state.employees.filter(emp => 
      state.filters.selectedEmployees.includes(emp.id)
    );
    return filtered;
  }, [state.employees, state.filters.selectedEmployees]);

  // 공휴일 데이터 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = state.selectedYear;
        const month = state.selectedMonth + 1;
        
        const holidayData = await holidayService.getHolidaysForMonth(year, month);
        setHolidays(holidayData);
      } catch (error) {
        console.error('공휴일 로드 실패:', error);
        setHolidays([]);
      }
    };
    
    loadHolidays();
  }, [state.selectedYear, state.selectedMonth]);

  return (
    <>
      {/* Pull-to-Refresh 컴포넌트 (모바일에서만 표시) */}
      {isEnabled && (
        <PullToRefresh
          isPulling={isPulling}
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={80}
        />
      )}
      
    <div className="main-content">
      {/* 데스크톱 필터 사이드바 */}
      <div className="filter-sidebar desktop-filter">
        <AdvancedFilter />
      </div>
      
      {/* 모바일 필터 모달 */}
      {state.ui.mobileFilterOpen && (
        <div className="modal-overlay">
          <div 
            className="modal-backdrop"
            onClick={() => {
              actions.toggleMobileFilter();
            }}
          />
          <div className="modal-container mobile-filter-modal">
            <div className="modal-header">
              <h3>필터 설정</h3>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  actions.toggleMobileFilter();
                }}
                aria-label="닫기"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-content mobile-filter-content">
              <AdvancedFilter />
            </div>
          </div>
        </div>
      )}
      
      {/* 메인 달력 영역 */}
      <div className="calendar-container">
        {isMobile ? (
          <MobileCalendar holidays={holidays} filteredEmployees={filteredEmployees} />
        ) : (
          <Calendar holidays={holidays} filteredEmployees={filteredEmployees} />
        )}
        
        {/* 간단한 통계 */}
        <div className="statistics-grid">
          <div className="stat-card">
            <h4>표시 중인 직원</h4>
            <div className="stat-number employee-count">
              {filteredEmployees.length}명
            </div>
          </div>
          
          <div className="stat-card">
            <h4>이번 달 휴가</h4>
            <div className="stat-number vacation-count">
              {state.vacations.filter(v => {
                const vDate = new Date(v.date);
                return vDate.getFullYear() === state.selectedYear && 
                       vDate.getMonth() === state.selectedMonth;
              }).length}개
            </div>
          </div>

          <div className="stat-card">
            <h4>이번 달 공휴일</h4>
            <div className="stat-number holiday-count">
              {holidays.length}일
            </div>
            {holidays.length > 0 && (
              <div className="holiday-list">
                {holidays.map(h => h.name).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BatchInput 모달 */}
      <BatchInput 
        isOpen={state.ui.activeModal === 'batchInput'} 
        onClose={() => actions.setModal(null)} 
      />

      {/* EmployeeManager 모달 */}
      <EmployeeManager 
        isOpen={state.ui.activeModal === 'employeeManager'} 
        onClose={() => actions.setModal(null)} 
      />



      {/* VacationModal - handles both add and edit modes */}
      {(state.ui.activeModal === 'vacation' || state.ui.activeModal === 'editVacation') && (
        <VacationModal />
      )}
      
      {/* DayVacationsModal - 일자별 휴가 보기 */}
      {state.ui.activeModal === 'dayVacations' && (
        <DayVacationsModal 
          isOpen={true}
          onClose={() => actions.setModal(null)}
          data={state.ui.modalProps}
        />
      )}
    </div>
    </>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent;
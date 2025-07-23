import React, { useMemo, useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import VacationModal from '../Vacation/VacationModal';
import AdvancedFilter from '../Filter/AdvancedFilter';
import BatchInput from '../BatchInput/BatchInput';
import EmployeeManager from '../Employee/EmployeeManager';
import Calendar from '../Calendar/Calendar';
import MobileCalendar from '../Calendar/MobileCalendar';
import holidayService from '../../services/holidayService';
import './MainContent.css';

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

function MainContent() {
  const vacationContext = useVacation();
  const { state = { employees: [], vacations: [], teams: [], filters: { selectedEmployees: [] } }, computed, actions } = vacationContext || {};
  const [holidays, setHolidays] = useState([]); // 공휴일 데이터
  const isMobile = useIsMobile();

  // 필터링된 직원들 (선택된 팀만) - 먼저 선언
  const filteredEmployees = useMemo(() => {
    console.log('🔍 직원 필터링 상태 (useMemo 재계산):', {
      totalEmployees: state.employees.length,
      selectedEmployees: state.filters.selectedEmployees, // Log this
      hasEmployeeFilter: state.filters.selectedEmployees && state.filters.selectedEmployees.length > 0
    });
    
    // selectedEmployees 필터를 사용 (더 정확함)
    if (!state.filters.selectedEmployees || state.filters.selectedEmployees.length === 0) {
      console.log('📋 선택된 직원 없음: 모든 직원 표시');
      return state.employees; // 모든 직원 표시로 변경
    }
    
    const filtered = state.employees.filter(emp => 
      state.filters.selectedEmployees.includes(emp.id)
    );
    console.log('📋 필터링된 직원:', filtered.map(e => ({ id: e.id, name: e.name, team: e.team })));
    return filtered;
  }, [state.employees, state.filters.selectedEmployees]);

  // 공휴일 데이터 로드
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const year = state.selectedYear;
        const month = state.selectedMonth + 1;
        
        console.log(`🎌 ${year}년 ${month}월 공휴일 로딩 중...`);
        const holidayData = await holidayService.getHolidaysForMonth(year, month);
        setHolidays(holidayData);
        
        console.log(`✅ 공휴일 ${holidayData.length}개 로드됨:`, holidayData.map(h => h.name).join(', '));
      } catch (error) {
        console.error('공휴일 로드 실패:', error);
        setHolidays([]);
      }
    };
    
    loadHolidays();
  }, [state.selectedYear, state.selectedMonth]);

  return (
    <div className="main-content">
      {/* 데스크톱 필터 사이드바 */}
      <div className="filter-sidebar desktop-filter">
        <AdvancedFilter />
      </div>
      
      {/* 모바일 필터 패널 */}
      {state.ui.mobileFilterOpen && (
        <>
          <div 
            className="mobile-filter-backdrop"
            onClick={() => actions.toggleFilter()}
          />
          <div className="mobile-filter-panel">
            <div className="mobile-filter-header">
              <h3>필터 설정</h3>
              <button 
                className="mobile-filter-close"
                onClick={() => actions.toggleFilter()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="mobile-filter-content">
              <AdvancedFilter />
            </div>
          </div>
        </>
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
    </div>
  );
}

export default MainContent;
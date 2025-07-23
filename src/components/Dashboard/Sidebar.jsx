import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { EmployeeListSkeleton, StatCardSkeleton } from '../Common/Skeleton';
import VacationStats from '../Statistics/VacationStats';
import VacationBalance from '../Balance/VacationBalance';
import ExcelExport from '../Export/ExcelExport';
import TeamVacationOverview from '../Team/TeamVacationOverview';
import FirebaseStatus from '../Firebase/FirebaseStatus';
import './Sidebar.css';

function Sidebar() {
  const { state, actions, computed } = useVacation();
  const [isLoading, setIsLoading] = useState(true);

  // 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [state.employees, state.vacations]);

  const handleEmployeeFilterChange = useCallback((employeeId) => {
    const currentFilters = state.filters.selectedEmployees;
    const newFilters = currentFilters.includes(employeeId)
      ? currentFilters.filter(id => id !== employeeId)
      : [...currentFilters, employeeId];
    actions.setFilters({ selectedEmployees: newFilters });
  }, [state.filters.selectedEmployees, actions]);

  const handleTypeFilterChange = useCallback((type) => {
    const currentFilters = state.filters.selectedTypes || [];
    const newFilters = currentFilters.includes(type)
      ? currentFilters.filter(t => t !== type)
      : [...currentFilters, type];
    actions.setFilters({ selectedTypes: newFilters });
  }, [state.filters.selectedTypes, actions]);

  const monthlyStats = useMemo(() => computed.getMonthlyStats(), [computed]);

  return (
    <aside className="grid-sidebar flex-col gap-6 animate-slide-in-left">
      {/* 필터 섹션 */}
      <div className="glass-card p-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          필터
        </h3>
        
        {/* 직원 목록 */}
        <div className="mb-6">
          <h4 className="body-regular font-medium mb-3 text-gray-700">직원</h4>
          <div className="space-y-2">
            {state.employees?.map(employee => (
              <label key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.filters?.selectedEmployees?.includes(employee.id) || false}
                  onChange={() => handleEmployeeFilterChange(employee.id)}
                  className="w-4 h-4 text-primary-start border-gray-300 rounded focus:ring-primary-start"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-start to-primary-end rounded-full flex-center text-white text-sm font-medium">
                    {employee.name.charAt(0)}
                  </div>
                  <span className="body-regular">{employee.name}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 휴가 유형 */}
        <div>
          <h4 className="body-regular font-medium mb-3 text-gray-700">휴가 유형</h4>
          <div className="space-y-2">
            {['연차', '반차(오전)', '반차(오후)', '병가', '특별휴가', '업무'].map(type => (
              <label key={type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.filters?.selectedTypes?.includes(type) || false}
                  onChange={() => handleTypeFilterChange(type)}
                  className="w-4 h-4 text-primary-start border-gray-300 rounded focus:ring-primary-start"
                />
                <span className="body-regular">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 빠른 액션 */}
      <div className="glass-card p-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          빠른 액션
        </h3>
        
        <div className="space-y-3">
          <button className="glass-button w-full justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            직원 추가
          </button>
          <button className="glass-button w-full justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            휴가 등록
          </button>
          <button className="glass-button w-full justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            일괄 입력
          </button>
        </div>
      </div>

      {/* 상세 통계 위젯 */}
      <VacationStats />
      
      {/* 휴가 잔여일수 관리 */}
      <VacationBalance />
      
      {/* 팀별 휴가 현황 */}
      <TeamVacationOverview />
      
      {/* Excel 내보내기 */}
      <ExcelExport />
      
      {/* Firebase 연결 상태 */}
      <FirebaseStatus />
    </aside>
  );
}

export default React.memo(Sidebar);
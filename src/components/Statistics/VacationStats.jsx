// VacationStats.jsx - 휴가 통계 대시보드
import React, { useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './VacationStats.css';

const VacationStats = () => {
  const { state } = useVacation();
  const { employees, vacations, selectedYear, selectedMonth } = state;

  // 현재 월의 통계 계산
  const monthlyStats = useMemo(() => {
    const currentDate = new Date(selectedYear, selectedMonth);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 현재 월의 휴가 필터링
    const monthlyVacations = vacations.filter(vacation => {
      const vacationDate = new Date(vacation.date);
      return vacationDate.getFullYear() === year && vacationDate.getMonth() === month;
    });

    // 직원별 휴가 통계
    const employeeStats = employees.map(employee => {
      const employeeVacations = monthlyVacations.filter(v => v.employeeId === employee.id);
      
      const stats = {
        annual: 0,
        morning: 0,
        afternoon: 0,
        special: 0,
        sick: 0,
        work: 0,
        total: 0
      };

      employeeVacations.forEach(vacation => {
        stats.total += 1;
        switch (vacation.type) {
          case '연차':
            stats.annual += 1;
            break;
          case '오전':
            stats.morning += 0.5;
            break;
          case '오후':
            stats.afternoon += 0.5;
            break;
          case '특별휴가':
            stats.special += 1;
            break;
          case '병가':
            stats.sick += 1;
            break;
          case '업무':
            stats.work += 1;
            break;
        }
      });

      return {
        employee,
        stats,
        vacations: employeeVacations
      };
    });

    // 전체 통계
    const totalStats = {
      totalVacations: monthlyVacations.length,
      totalEmployees: employees.length,
      averageVacations: employees.length > 0 ? (monthlyVacations.length / employees.length).toFixed(1) : 0,
      typeBreakdown: {
        annual: monthlyVacations.filter(v => v.type === '연차').length,
        morning: monthlyVacations.filter(v => v.type === '오전').length,
        afternoon: monthlyVacations.filter(v => v.type === '오후').length,
        special: monthlyVacations.filter(v => v.type === '특별휴가').length,
        sick: monthlyVacations.filter(v => v.type === '병가').length,
        work: monthlyVacations.filter(v => v.type === '업무').length,
      }
    };

    return {
      employeeStats,
      totalStats,
      monthlyVacations
    };
  }, [employees, vacations, selectedYear, selectedMonth]);

  const getVacationTypeColor = (type) => {
    const colors = {
      '연차': '#4285f4',
      '오전': '#9b59b6',
      '오후': '#e67e22',
      '특별휴가': '#e74c3c',
      '병가': '#95a5a6',
      '업무': '#34495e'
    };
    return colors[type] || '#95a5a6';
  };

  const getVacationTypeIcon = (type) => {
    const icons = {
      '연차': '🏖️',
      '오전': '🌅',
      '오후': '🌅',
      '특별휴가': '⭐',
      '병가': '🏥',
      '업무': '💼'
    };
    return icons[type] || '📅';
  };

  return (
    <div className="vacation-stats">
      <div className="stats-header">
        <h3 className="stats-title">
          📊 {selectedYear}년 {selectedMonth + 1}월 휴가 현황
        </h3>
      </div>

      {/* 전체 통계 카드 */}
      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-icon">📅</div>
          <div className="summary-content">
            <div className="summary-number">{monthlyStats.totalStats.totalVacations}</div>
            <div className="summary-label">총 휴가</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <div className="summary-number">{monthlyStats.totalStats.totalEmployees}</div>
            <div className="summary-label">총 직원</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <div className="summary-number">{monthlyStats.totalStats.averageVacations}</div>
            <div className="summary-label">평균 휴가</div>
          </div>
        </div>
      </div>

      {/* 휴가 유형별 통계 */}
      <div className="type-breakdown">
        <h4 className="breakdown-title">휴가 유형별 현황</h4>
        <div className="type-stats">
          {Object.entries(monthlyStats.totalStats.typeBreakdown).map(([type, count]) => {
            const typeMap = {
              annual: '연차',
              morning: '오전',
              afternoon: '오후',
              special: '특별휴가',
              sick: '병가',
              work: '업무'
            };
            const koreanType = typeMap[type];
            
            if (count === 0) return null;
            
            return (
              <div key={type} className="type-stat-item">
                <div 
                  className="type-indicator" 
                  style={{ backgroundColor: getVacationTypeColor(koreanType) }}
                >
                  {getVacationTypeIcon(koreanType)}
                </div>
                <span className="type-name">{koreanType}</span>
                <span className="type-count">{count}건</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 직원별 상세 통계 */}
      <div className="employee-stats">
        <h4 className="employee-stats-title">직원별 휴가 현황</h4>
        <div className="employee-stats-grid">
          {monthlyStats.employeeStats.map(({ employee, stats, vacations }) => (
            <div key={employee.id} className="employee-stat-card">
              <div className="employee-header">
                <div 
                  className="employee-avatar"
                  style={{ backgroundColor: employee.color || '#4285f4' }}
                >
                  {employee.name.charAt(0)}
                </div>
                <div className="employee-info">
                  <div className="employee-name">{employee.name}</div>
                  <div className="employee-team">{employee.team}</div>
                </div>
                <div className="employee-total">
                  <span className="total-number">{stats.total}</span>
                  <span className="total-label">건</span>
                </div>
              </div>
              
              {vacations.length > 0 && (
                <div className="employee-vacation-list">
                  {vacations.slice(0, 3).map(vacation => (
                    <div key={vacation.id} className="vacation-item">
                      <span 
                        className="vacation-type-badge"
                        style={{ backgroundColor: getVacationTypeColor(vacation.type) }}
                      >
                        {vacation.type}
                      </span>
                      <span className="vacation-date">
                        {new Date(vacation.date).toLocaleDateString('ko-KR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  ))}
                  {vacations.length > 3 && (
                    <div className="vacation-more">
                      +{vacations.length - 3}개 더
                    </div>
                  )}
                </div>
              )}
              
              {vacations.length === 0 && (
                <div className="no-vacations">
                  이번 달 휴가 없음
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VacationStats;
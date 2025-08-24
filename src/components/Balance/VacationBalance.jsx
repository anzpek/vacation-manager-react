// VacationBalance.jsx - 휴가 잔여일수 관리 컴포넌트
import React, { useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './VacationBalance.css';

const VacationBalance = () => {
  const { state } = useVacation();
  const { employees, vacations, selectedYear } = state;

  // 직원별 연간 휴가 잔여일수 계산
  const employeeBalances = useMemo(() => {
    return employees.map(employee => {
      // 기본 연차 일수 (입사년도에 따라 다르게 설정 가능)
      const baseAnnualLeave = 15; // 기본 15일
      const additionalLeave = 0; // 추가 연차 (근속년수 등에 따라)
      const totalAnnualLeave = baseAnnualLeave + additionalLeave;

      // 해당 연도의 직원 휴가 계산
      const yearlyVacations = vacations.filter(vacation => {
        const vacationDate = new Date(vacation.date);
        return vacationDate.getFullYear() === selectedYear && 
               vacation.employeeId === employee.id;
      });

      // 휴가 타입별 사용일수 계산
      let usedDays = {
        annual: 0,      // 연차
        halfDay: 0,     // 반차 (0.5일씩 계산)
        special: 0,     // 특별휴가
        sick: 0,        // 병가
        total: 0        // 총 사용일수
      };

      yearlyVacations.forEach(vacation => {
        switch (vacation.type) {
          case '연차':
            usedDays.annual += 1;
            usedDays.total += 1;
            break;
          case '오전':
          case '오후':
            usedDays.halfDay += 0.5;
            usedDays.total += 0.5;
            break;
          case '특별휴가':
            usedDays.special += 1;
            usedDays.total += 1;
            break;
          case '병가':
            usedDays.sick += 1;
            // 병가는 연차에서 차감하지 않음
            break;
        }
      });

      // 연차 잔여일수 계산 (연차 + 반차만 차감)
      const remainingAnnualLeave = totalAnnualLeave - usedDays.annual - usedDays.halfDay;
      const usageRate = totalAnnualLeave > 0 ? ((usedDays.annual + usedDays.halfDay) / totalAnnualLeave * 100) : 0;

      return {
        employee,
        totalAnnualLeave,
        usedDays,
        remainingAnnualLeave,
        usageRate: Math.round(usageRate * 10) / 10, // 소수점 1자리
        vacations: yearlyVacations
      };
    });
  }, [employees, vacations, selectedYear]);

  const getUsageColor = (rate) => {
    if (rate >= 80) return '#e74c3c';      // 빨강 (80% 이상)
    if (rate >= 60) return '#f39c12';      // 주황 (60-80%)
    if (rate >= 40) return '#f1c40f';      // 노랑 (40-60%)
    return '#27ae60';                      // 초록 (40% 미만)
  };

  const getUsageStatus = (rate) => {
    if (rate >= 80) return '높음';
    if (rate >= 60) return '보통';
    if (rate >= 40) return '양호';
    return '여유';
  };

  return (
    <div className="vacation-balance">
      <div className="balance-header">
        <h3 className="balance-title">
          💼 {selectedYear}년 연차 잔여현황
        </h3>
        <div className="balance-summary">
          <div className="summary-item">
            <span className="summary-label">총 직원</span>
            <span className="summary-value">{employees.length}명</span>
          </div>
        </div>
      </div>

      <div className="balance-grid">
        {employeeBalances.map(({ employee, totalAnnualLeave, usedDays, remainingAnnualLeave, usageRate, vacations }) => (
          <div key={employee.id} className="balance-card">
            <div className="balance-card-header">
              <div className="employee-info">
                <div 
                  className="employee-avatar"
                  style={{ backgroundColor: employee.color || '#4285f4' }}
                >
                  {employee.name.charAt(0)}
                </div>
                <div className="employee-details">
                  <div className="employee-name">{employee.name}</div>
                  <div className="employee-team">{employee.team}</div>
                </div>
              </div>
              <div 
                className="usage-badge"
                style={{ backgroundColor: getUsageColor(usageRate) }}
              >
                {getUsageStatus(usageRate)}
              </div>
            </div>

            <div className="balance-progress">
              <div className="progress-info">
                <span className="progress-label">연차 사용률</span>
                <span className="progress-percentage">{usageRate}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${Math.min(usageRate, 100)}%`,
                    backgroundColor: getUsageColor(usageRate)
                  }}
                />
              </div>
            </div>

            <div className="balance-stats">
              <div className="stat-row">
                <div className="stat-item">
                  <span className="stat-label">총 연차</span>
                  <span className="stat-value">{totalAnnualLeave}일</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">사용</span>
                  <span className="stat-value used">{usedDays.annual + usedDays.halfDay}일</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">잔여</span>
                  <span className="stat-value remaining">{remainingAnnualLeave}일</span>
                </div>
              </div>

              <div className="detailed-usage">
                <div className="usage-breakdown">
                  {usedDays.annual > 0 && (
                    <div className="usage-item">
                      <span className="usage-type">연차</span>
                      <span className="usage-count">{usedDays.annual}일</span>
                    </div>
                  )}
                  {usedDays.halfDay > 0 && (
                    <div className="usage-item">
                      <span className="usage-type">반차</span>
                      <span className="usage-count">{usedDays.halfDay}일</span>
                    </div>
                  )}
                  {usedDays.special > 0 && (
                    <div className="usage-item">
                      <span className="usage-type">특별</span>
                      <span className="usage-count">{usedDays.special}일</span>
                    </div>
                  )}
                  {usedDays.sick > 0 && (
                    <div className="usage-item">
                      <span className="usage-type">병가</span>
                      <span className="usage-count">{usedDays.sick}일</span>
                    </div>
                  )}
                  {vacations.length === 0 && (
                    <div className="no-usage">
                      사용한 연차가 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>

            {remainingAnnualLeave <= 3 && remainingAnnualLeave > 0 && (
              <div className="warning-message">
                ⚠️ 연차가 {remainingAnnualLeave}일 남았습니다
              </div>
            )}
            
            {remainingAnnualLeave <= 0 && (
              <div className="danger-message">
                🚨 연차를 모두 사용했습니다
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="balance-footer">
        <div className="footer-info">
          <div className="info-item">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              병가는 연차에서 차감되지 않으며, 반차는 0.5일로 계산됩니다.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationBalance;
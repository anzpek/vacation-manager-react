// TeamVacationOverview.jsx - 팀별 휴가 현황 위젯
import React, { useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './TeamVacationOverview.css';

const TeamVacationOverview = () => {
  const { state } = useVacation();
  const { employees, vacations, selectedYear, selectedMonth } = state;

  // 팀별 휴가 현황 계산
  const teamOverview = useMemo(() => {
    // 팀별 직원 그룹화
    const teamGroups = employees.reduce((acc, employee) => {
      const team = employee.team || '미지정';
      if (!acc[team]) {
        acc[team] = [];
      }
      acc[team].push(employee);
      return acc;
    }, {});

    // 현재 월의 휴가 필터링
    const currentMonthVacations = vacations.filter(vacation => {
      const vacationDate = new Date(vacation.date);
      return vacationDate.getFullYear() === selectedYear && 
             vacationDate.getMonth() === selectedMonth;
    });

    // 팀별 현황 계산
    return Object.entries(teamGroups).map(([teamName, teamMembers]) => {
      const teamVacations = currentMonthVacations.filter(vacation =>
        teamMembers.some(member => member.id === vacation.employeeId)
      );

      // 현재 날짜
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // 오늘 휴가인 직원들
      const todayVacations = teamVacations.filter(vacation => vacation.date === todayString);
      
      // 이번 주 휴가인 직원들 (월요일~일요일)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const thisWeekVacations = teamVacations.filter(vacation => {
        const vacationDate = new Date(vacation.date);
        return vacationDate >= startOfWeek && vacationDate <= endOfWeek;
      });

      // 팀 내 휴가 사용률 계산
      const totalTeamVacations = teamVacations.length;
      const averageVacationsPerMember = teamMembers.length > 0 ? 
        (totalTeamVacations / teamMembers.length).toFixed(1) : 0;

      // 휴가 유형별 분류
      const vacationTypes = {
        연차: teamVacations.filter(v => v.type === '연차').length,
        반차: teamVacations.filter(v => v.type === '오전' || v.type === '오후').length,
        특별휴가: teamVacations.filter(v => v.type === '특별휴가').length,
        병가: teamVacations.filter(v => v.type === '병가').length,
        업무: teamVacations.filter(v => v.type === '업무').length
      };

      return {
        teamName,
        memberCount: teamMembers.length,
        totalVacations: totalTeamVacations,
        averageVacations: averageVacationsPerMember,
        todayVacations,
        thisWeekVacations,
        vacationTypes,
        members: teamMembers
      };
    }).sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [employees, vacations, selectedYear, selectedMonth]);

  const getVacationStatusColor = (count, total) => {
    if (total === 0) return '#95a5a6';
    const ratio = count / total;
    if (ratio >= 0.5) return '#e74c3c'; // 높음 (빨강)
    if (ratio >= 0.3) return '#f39c12'; // 보통 (주황)
    return '#27ae60'; // 낮음 (초록)
  };

  const getTeamStatusIcon = (todayCount, totalMembers) => {
    if (todayCount === 0) return '✅';
    if (todayCount / totalMembers >= 0.5) return '🚨';
    if (todayCount >= 2) return '⚠️';
    return '📝';
  };

  return (
    <div className="team-vacation-overview">
      <div className="overview-header">
        <h3 className="overview-title">
          👥 팀별 휴가 현황
        </h3>
        <p className="overview-subtitle">
          {selectedYear}년 {selectedMonth + 1}월 팀별 휴가 현황 요약
        </p>
      </div>

      <div className="team-grid">
        {teamOverview.map((team) => (
          <div key={team.teamName} className="team-card">
            <div className="team-card-header">
              <div className="team-info">
                <h4 className="team-name">{team.teamName}</h4>
                <span className="team-member-count">{team.memberCount}명</span>
              </div>
              <div className="team-status">
                <span className="status-icon">
                  {getTeamStatusIcon(team.todayVacations.length, team.memberCount)}
                </span>
              </div>
            </div>

            <div className="team-stats">
              <div className="stat-item">
                <span className="stat-label">이번 달</span>
                <span className="stat-value">{team.totalVacations}건</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">평균</span>
                <span className="stat-value">{team.averageVacations}건/명</span>
              </div>
            </div>

            <div className="vacation-breakdown">
              <div className="breakdown-title">휴가 유형별</div>
              <div className="breakdown-items">
                {Object.entries(team.vacationTypes).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="breakdown-item">
                      <span className="breakdown-type">{type}</span>
                      <span className="breakdown-count">{count}</span>
                    </div>
                  )
                ))}
                {team.totalVacations === 0 && (
                  <div className="no-vacations">휴가 없음</div>
                )}
              </div>
            </div>

            <div className="current-status">
              <div className="status-section">
                <div className="status-title">오늘 ({new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})</div>
                {team.todayVacations.length > 0 ? (
                  <div className="vacation-list">
                    {team.todayVacations.map(vacation => {
                      const employee = team.members.find(m => m.id === vacation.employeeId);
                      return (
                        <div key={vacation.id} className="vacation-person">
                          <span className="person-name">{employee?.name}</span>
                          <span className="vacation-type">{vacation.type}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-vacation-today">휴가자 없음</div>
                )}
              </div>

              <div className="status-section">
                <div className="status-title">이번 주</div>
                {team.thisWeekVacations.length > 0 ? (
                  <div className="week-summary">
                    <span className="week-count">{team.thisWeekVacations.length}건</span>
                    <span className="week-detail">
                      ({new Set(team.thisWeekVacations.map(v => v.employeeId)).size}명)
                    </span>
                  </div>
                ) : (
                  <div className="no-vacation-week">휴가 없음</div>
                )}
              </div>
            </div>

            <div className="team-impact">
              <div className="impact-bar">
                <div className="impact-label">팀 가용성</div>
                <div className="impact-meter">
                  <div 
                    className="impact-fill"
                    style={{
                      width: `${Math.max(0, 100 - (team.todayVacations.length / team.memberCount * 100))}%`,
                      backgroundColor: getVacationStatusColor(team.todayVacations.length, team.memberCount)
                    }}
                  />
                </div>
                <div className="impact-percentage">
                  {Math.round(Math.max(0, 100 - (team.todayVacations.length / team.memberCount * 100)))}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teamOverview.length === 0 && (
        <div className="no-teams">
          <div className="no-teams-icon">👥</div>
          <div className="no-teams-text">등록된 팀이 없습니다</div>
        </div>
      )}
    </div>
  );
};

export default TeamVacationOverview;
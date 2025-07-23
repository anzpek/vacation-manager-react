import React, { useState, useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './AdvancedFilter.css';

const AdvancedFilter = () => {
  const { state, actions } = useVacation();
  const { employees, filters } = state;
  
  // 팀별 상태 관리 (체크됨 + 접기/펼치기 + 개별 직원 필터)
  const [teamStates, setTeamStates] = useState({});
  const [employeeStates, setEmployeeStates] = useState({});
  
  // 팀별 그룹핑
  const teamGroups = useMemo(() => {
    const groups = {};
    
    employees.forEach(employee => {
      const teamName = employee.team || '미지정';
      if (!groups[teamName]) {
        groups[teamName] = {
          id: teamName,
          name: teamName,
          employees: [],
          totalCount: 0
        };
      }
      groups[teamName].employees.push(employee);
      groups[teamName].totalCount++;
    });
    
    // 각 팀 내에서 직급순으로 정렬 (부장 > 팀장 > 팀원)
    Object.values(groups).forEach(group => {
      group.employees.sort((a, b) => {
        const positionOrder = { 'manager': 0, 'leader': 1, 'member': 2 };
        const orderA = positionOrder[a.position] ?? 3;
        const orderB = positionOrder[b.position] ?? 3;
        return orderA - orderB;
      });
    });
    
    // 팀 정렬: 부장이 속한 팀을 가장 상단에 위치
    const sortedGroups = Object.values(groups).sort((teamA, teamB) => {
      const hasManagerA = teamA.employees.some(emp => emp.position === 'manager');
      const hasManagerB = teamB.employees.some(emp => emp.position === 'manager');
      
      // 부장이 있는 팀이 위로
      if (hasManagerA && !hasManagerB) return -1;
      if (!hasManagerA && hasManagerB) return 1;
      
      // 둘 다 부장이 있거나 둘 다 없으면 팀명 알파벳 순
      return teamA.name.localeCompare(teamB.name);
    });
    
    return sortedGroups;
  }, [employees]);
  
  // 팀 상태 초기화 (처음 렌더링 시)
  React.useEffect(() => {
    const initialTeamStates = {};
    const initialEmployeeStates = {};
    
    teamGroups.forEach(team => {
      if (!teamStates[team.id]) {
        initialTeamStates[team.id] = {
          checked: true,      // 기본적으로 모든 팀 체크
          collapsed: false    // 기본적으로 모든 팀 펼쳐짐
        };
      }
      
      // 직원별 상태도 초기화
      team.employees.forEach(employee => {
        if (!employeeStates[employee.id]) {
          initialEmployeeStates[employee.id] = true; // 기본적으로 모든 직원 표시
        }
      });
    });
    
    if (Object.keys(initialTeamStates).length > 0) {
      setTeamStates(prev => ({ ...prev, ...initialTeamStates }));
    }
    if (Object.keys(initialEmployeeStates).length > 0) {
      setEmployeeStates(prev => ({ ...prev, ...initialEmployeeStates }));
    }
  }, [teamGroups]);
  
  // 전체 선택 상태 계산
  const allTeamsChecked = useMemo(() => {
    return teamGroups.every(team => teamStates[team.id]?.checked);
  }, [teamGroups, teamStates]);
  
  // 일부 선택 상태 계산
  const someTeamsChecked = useMemo(() => {
    return teamGroups.some(team => teamStates[team.id]?.checked);
  }, [teamGroups, teamStates]);
  
  // 선택된 직원 수 계산
  const selectedEmployeeCount = useMemo(() => {
    let count = 0;
    teamGroups.forEach(team => {
      if (teamStates[team.id]?.checked) {
        team.employees.forEach(employee => {
          if (employeeStates[employee.id]) {
            count++;
          }
        });
      }
    });
    return count;
  }, [teamGroups, teamStates, employeeStates]);
  
  // 팀별 선택된 직원 수 계산
  const getTeamSelectedCount = (team) => {
    if (!teamStates[team.id]?.checked) return 0;
    return team.employees.filter(emp => employeeStates[emp.id]).length;
  };
  
  // 전체 선택/해제
  const handleSelectAll = () => {
    const newChecked = !allTeamsChecked;
    const newTeamStates = { ...teamStates };
    const newEmployeeStates = { ...employeeStates };
    
    teamGroups.forEach(team => {
      newTeamStates[team.id] = {
        ...newTeamStates[team.id],
        checked: newChecked
      };
      
      // 팀이 체크되면 모든 직원도 체크, 해제되면 모든 직원도 해제
      team.employees.forEach(employee => {
        newEmployeeStates[employee.id] = newChecked;
      });
    });
    
    setTeamStates(newTeamStates);
    setEmployeeStates(newEmployeeStates);
    updateFilters(newTeamStates, newEmployeeStates);
  };
  
  // 팀별 체크박스 토글 - 폴더 상태 유지
  const handleTeamToggle = (teamId) => {
    const team = teamGroups.find(t => t.id === teamId);
    const newTeamStates = {
      ...teamStates,
      [teamId]: {
        ...teamStates[teamId],
        checked: !teamStates[teamId]?.checked,
        collapsed: teamStates[teamId]?.collapsed || false // 폴더 상태 유지
      }
    };
    
    const newEmployeeStates = { ...employeeStates };
    const isTeamChecked = newTeamStates[teamId].checked;
    
    // 팀이 체크되면 모든 직원 체크, 해제되면 모든 직원 해제
    team.employees.forEach(employee => {
      newEmployeeStates[employee.id] = isTeamChecked;
    });
    
    setTeamStates(newTeamStates);
    setEmployeeStates(newEmployeeStates);
    updateFilters(newTeamStates, newEmployeeStates);
  };
  
  // 개별 직원 토글
  const handleEmployeeToggle = (employeeId) => {
    const newEmployeeStates = {
      ...employeeStates,
      [employeeId]: !employeeStates[employeeId]
    };
    
    // 해당 직원이 속한 팀 찾기
    const employee = employees.find(emp => emp.id === employeeId);
    const team = teamGroups.find(t => t.id === employee.team);
    
    // 팀 내의 모든 직원이 해제되면 팀도 해제
    const teamEmployeeStates = team.employees.map(emp => 
      emp.id === employeeId ? newEmployeeStates[employeeId] : employeeStates[emp.id]
    );
    
    const newTeamStates = { ...teamStates };
    if (teamEmployeeStates.every(state => !state)) {
      // 팀의 모든 직원이 해제되면 팀도 해제
      newTeamStates[team.id] = {
        ...newTeamStates[team.id],
        checked: false
      };
    } else if (teamEmployeeStates.some(state => state)) {
      // 팀에 체크된 직원이 있으면 팀도 체크
      newTeamStates[team.id] = {
        ...newTeamStates[team.id],
        checked: true
      };
    }
    
    setTeamStates(newTeamStates);
    setEmployeeStates(newEmployeeStates);
    updateFilters(newTeamStates, newEmployeeStates);
  };
  
  // 팀 접기/펼치기 토글
  const handleTeamCollapse = (teamId) => {
    const newStates = {
      ...teamStates,
      [teamId]: {
        ...teamStates[teamId],
        collapsed: !teamStates[teamId]?.collapsed
      }
    };
    
    setTeamStates(newStates);
  };
  
  // 필터 상태를 VacationContext에 업데이트
  const updateFilters = (teamStatesParam, employeeStatesParam) => {
    const selectedEmployees = [];
    
    teamGroups.forEach(team => {
      if (teamStatesParam[team.id]?.checked) {
        team.employees.forEach(employee => {
          if (employeeStatesParam[employee.id]) {
            selectedEmployees.push(employee.id);
          }
        });
      }
    });
    
    actions.setFilters({
      selectedEmployees: selectedEmployees,
      selectedTeams: teamGroups.filter(team => teamStatesParam[team.id]?.checked).map(team => team.id)
    });
  };
  
  // 필터 초기화
  const handleResetFilters = () => {
    const resetTeamStates = {};
    const resetEmployeeStates = {};
    
    teamGroups.forEach(team => {
      resetTeamStates[team.id] = {
        checked: true,
        collapsed: false
      };
      
      team.employees.forEach(employee => {
        resetEmployeeStates[employee.id] = true;
      });
    });
    
    setTeamStates(resetTeamStates);
    setEmployeeStates(resetEmployeeStates);
    updateFilters(resetTeamStates, resetEmployeeStates);
  };
  
  return (
    <div className="advanced-filter">
      {/* 필터 헤더 */}
      <div className="filter-header">
        <div className="filter-title-section">
          <h3 className="filter-title">필터</h3>
          <span className="filter-stats">
            {selectedEmployeeCount} / {employees.length}
          </span>
        </div>
      </div>
      
      {/* 전체 선택/해제 */}
      <div className="filter-controls">
        <label className="global-checkbox-container">
          <input 
            type="checkbox"
            checked={allTeamsChecked}
            ref={input => {
              if (input) input.indeterminate = someTeamsChecked && !allTeamsChecked;
            }}
            onChange={handleSelectAll}
            className="global-checkbox-input"
          />
          <div className="checkbox-design"></div>
          <span className="global-checkbox-label">전체 선택</span>
        </label>
        
        <button 
          className="reset-button"
          onClick={handleResetFilters}
          disabled={allTeamsChecked && teamGroups.every(team => !teamStates[team.id]?.collapsed)}
          title="필터 초기화"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M21 3v5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          초기화
        </button>
      </div>
      
      {/* 팀별 필터 */}
      <div className="team-filters">
        <div className="team-list">
          {teamGroups.map(team => {
            const teamState = teamStates[team.id] || { checked: true, collapsed: false };
            const isTeamChecked = teamState.checked;
            const isCollapsed = teamState.collapsed;
            const selectedCount = getTeamSelectedCount(team);
            
            return (
              <div key={team.id} className={`team-item ${isTeamChecked ? 'team-visible' : 'team-hidden'}`}>
                {/* 팀 헤더 */}
                <div className="team-header">
                  <button 
                    className="collapse-toggle"
                    onClick={() => handleTeamCollapse(team.id)}
                    title={isCollapsed ? '펼치기' : '접기'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      className={`toggle-arrow ${isCollapsed ? 'collapsed' : 'expanded'}`}
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  
                  <label className="team-checkbox-container">
                    <input 
                      type="checkbox"
                      checked={isTeamChecked}
                      onChange={() => handleTeamToggle(team.id)}
                      className="team-checkbox-input"
                    />
                    <div className="checkbox-design team-checkbox"></div>
                    
                    <div className="team-info">
                      <span className="team-name">{team.name}</span>
                      <span className="team-count">
                        {isTeamChecked ? `${selectedCount}/${team.totalCount}` : `${team.totalCount}`}
                      </span>
                    </div>
                  </label>
                  
                  <div className={`team-status ${isTeamChecked ? 'visible' : 'hidden'}`}>
                    {isTeamChecked && selectedCount < team.totalCount && (
                      <span className="partial-selection">일부</span>
                    )}
                  </div>
                </div>
                
                {/* 직원 목록 (펼쳐진 경우만) - 가로 배열 */}
                {!isCollapsed && isTeamChecked && (
                  <div className="employee-list horizontal-layout">
                    {team.employees.map(employee => {
                      const isEmployeeVisible = employeeStates[employee.id];
                      
                      return (
                        <div 
                          key={employee.id} 
                          className={`employee-item ${isEmployeeVisible ? 'employee-visible' : 'employee-hidden'}`}
                          onClick={() => handleEmployeeToggle(employee.id)}
                        >
                          <input 
                            type="checkbox"
                            checked={isEmployeeVisible}
                            onChange={() => handleEmployeeToggle(employee.id)}
                            className="employee-checkbox-input"
                            onClick={(e) => e.stopPropagation()} // 중복 클릭 방지
                          />
                          <div className="checkbox-design employee-checkbox"></div>
                          
                          <div className="employee-info horizontal">
                            <div 
                              className="employee-avatar"
                              style={{ backgroundColor: employee.color || '#4285f4' }}
                              title={`${employee.name} ${employee.position === 'member' ? '팀원' :
                               employee.position === 'leader' ? '팀장' :
                               employee.position === 'manager' ? '부장' : employee.position}`}
                            ></div>
                            <div className="employee-text">
                              <span className="employee-name">{employee.name}</span>
                            </div>
                          </div>
                          
                          {/* 직급 표시를 오른쪽 별도 영역으로 */}
                          <span className={`employee-team ${
                            employee.position === 'manager' ? 'manager' :
                            employee.position === 'leader' ? 'leader' : ''
                          }`}>
                            {employee.position === 'member' ? '팀원' :
                             employee.position === 'leader' ? '팀장' :
                             employee.position === 'manager' ? '부장' : employee.position}
                          </span>
                        </div>
                      );
                    })}
                    
                    {team.employees.length === 0 && (
                      <div className="empty-team">
                        <span className="empty-message">등록된 직원이 없습니다</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {teamGroups.length === 0 && (
          <div className="empty-filter">
            <div className="empty-title">직원이 없습니다</div>
            <div className="empty-description">
              부서 관리에서 직원을 먼저 등록해주세요
            </div>
          </div>
        )}
      </div>
      
      {/* 현재 필터 상태 요약 */}
      <div className="filter-summary">
        <div className="summary-title">표시 중인 팀</div>
        <div className="visible-teams">
          {teamGroups
            .filter(team => teamStates[team.id]?.checked)
            .map(team => {
              const selectedCount = getTeamSelectedCount(team);
              return (
                <div key={team.id} className="team-summary-tag">
                  <span className="team-tag-name">{team.name}</span>
                  <span className="team-tag-count">{selectedCount}/{team.totalCount}</span>
                </div>
              );
            })
          }
          
          {selectedEmployeeCount === 0 && (
            <div className="no-teams">
              <span className="no-teams-text">표시할 직원이 없습니다</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilter;
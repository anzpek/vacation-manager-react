// EmployeeFilter.jsx - 직원 필터 컴포넌트
import React, { useState } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './EmployeeFilter.css';

const EmployeeFilter = () => {
    const { state, actions, computed } = useVacation();
    const { filterSettings } = state;
    const [viewMode, setViewMode] = useState('department'); // 'team' | 'department' - 기본값을 부서별로 변경

    // 팀별 그룹화된 직원
    const employeesByTeam = computed.getEmployeesGroupedByTeam();
    
    // 부서별 그룹화된 직원
    const employeesByDepartment = computed.getEmployeesGroupedByDepartment();

    // 팀 전체 선택/해제
    const handleTeamToggle = (teamName) => {
        const teamEmployees = employeesByTeam[teamName].map(emp => emp.name);
        const isAllSelected = teamEmployees.every(emp => 
            filterSettings.selectedEmployees.includes(emp)
        );

        let newSelectedEmployees;
        if (isAllSelected) {
            // 팀 전체 해제
            newSelectedEmployees = filterSettings.selectedEmployees.filter(emp => 
                !teamEmployees.includes(emp)
            );
        } else {
            // 팀 전체 선택
            newSelectedEmployees = [
                ...filterSettings.selectedEmployees.filter(emp => 
                    !teamEmployees.includes(emp)
                ),
                ...teamEmployees
            ];
        }

        actions.updateFilter({ selectedEmployees: newSelectedEmployees });
    };

    // 개별 직원 선택/해제
    const handleEmployeeToggle = (employeeName) => {
        const isSelected = filterSettings.selectedEmployees.includes(employeeName);
        let newSelectedEmployees;

        if (isSelected) {
            newSelectedEmployees = filterSettings.selectedEmployees.filter(emp => 
                emp !== employeeName
            );
        } else {
            newSelectedEmployees = [...filterSettings.selectedEmployees, employeeName];
        }

        actions.updateFilter({ selectedEmployees: newSelectedEmployees });
    };

    // 전체 선택/해제
    const handleSelectAll = () => {
        const allEmployees = state.employees.filter(emp => !emp.hidden).map(emp => emp.name);
        const isAllSelected = allEmployees.length === filterSettings.selectedEmployees.length;

        actions.updateFilter({ 
            selectedEmployees: isAllSelected ? [] : allEmployees 
        });
    };

    // 필터 초기화
    const handleResetFilter = () => {
        actions.updateFilter({
            selectedEmployees: [],
            selectedTeams: []
        });
    };

    // 팀이 전체 선택되었는지 확인
    const isTeamFullySelected = (teamName) => {
        const teamEmployees = employeesByTeam[teamName].map(emp => emp.name);
        return teamEmployees.every(emp => 
            filterSettings.selectedEmployees.includes(emp)
        );
    };

    // 팀이 부분 선택되었는지 확인
    const isTeamPartiallySelected = (teamName) => {
        const teamEmployees = employeesByTeam[teamName].map(emp => emp.name);
        const selectedCount = teamEmployees.filter(emp => 
            filterSettings.selectedEmployees.includes(emp)
        ).length;
        return selectedCount > 0 && selectedCount < teamEmployees.length;
    };

    const renderTeamView = () => (
        <div className="filter-content">
            {Object.keys(employeesByTeam).map(teamName => {
                const teamEmployees = employeesByTeam[teamName];
                const isFullySelected = isTeamFullySelected(teamName);
                const isPartiallySelected = isTeamPartiallySelected(teamName);

                return (
                    <div key={teamName} className="team-group">
                        <div className="team-header">
                            <label className="team-checkbox">
                                <input
                                    type="checkbox"
                                    checked={isFullySelected}
                                    ref={input => {
                                        if (input) input.indeterminate = isPartiallySelected;
                                    }}
                                    onChange={() => handleTeamToggle(teamName)}
                                />
                                <span className="team-name">{teamName}</span>
                                <span className="team-count">({teamEmployees.length})</span>
                            </label>
                        </div>
                        
                        <div className="employee-list">
                            {teamEmployees.map(employee => (
                                <div key={`${employee.id}-${employee.name}`} className="employee-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={filterSettings.selectedEmployees.includes(employee.name)}
                                        onChange={() => handleEmployeeToggle(employee.name)}
                                    />
                                    <span 
                                        className="employee-color"
                                        style={{ backgroundColor: employee.color }}
                                    />
                                    <span className="employee-name">{employee.name}</span>
                                    <span className="employee-team">{employee.team}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const renderDepartmentView = () => (
        <div className="filter-content">
            {Object.keys(employeesByDepartment).map(deptName => {
                const dept = employeesByDepartment[deptName];

                return (
                    <div key={deptName} className="department-group">
                        <div className="department-header">
                            <label className="department-checkbox">
                                <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={() => {}}
                                />
                                <span className="department-icon">🏢</span>
                                <span className="department-name">{deptName}</span>
                                <span className="department-count">
                                    ({Object.values(dept.teams).reduce((sum, team) => 
                                        sum + team.members.length + (team.leader ? 1 : 0), 
                                        dept.manager ? 1 : 0
                                    )})
                                </span>
                            </label>
                        </div>

                        {/* 부장 표시 (가장 위에) */}
                        {dept.manager && (
                            <div className="manager-section">
                                <label className="employee-checkbox manager">
                                    <input
                                        type="checkbox"
                                        checked={filterSettings.selectedEmployees.includes(dept.manager)}
                                        onChange={() => handleEmployeeToggle(dept.manager)}
                                    />
                                    <span className="role-icon manager-icon">👨‍💼</span>
                                    <span className="employee-name">{dept.manager}</span>
                                    <span className="employee-team">{deptName}</span>
                                    <span className="employee-role">(부장)</span>
                                </label>
                            </div>
                        )}

                        {Object.keys(dept.teams).map(teamName => {
                            const team = dept.teams[teamName];

                            return (
                                <div key={teamName} className="team-group">
                                    <div className="team-header">
                                        <label className="team-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={() => {}}
                                            />
                                            <span className="team-icon">👥</span>
                                            <span className="team-name">{teamName}</span>
                                            <span className="team-count">
                                                ({team.members.length + (team.leader ? 1 : 0)})
                                            </span>
                                        </label>
                                    </div>
                                    
                                    <div className="employee-list">
                                        {/* 팀장 표시 (팀 내에서 가장 위에) */}
                                        {team.leader && (
                                            <label className="employee-checkbox leader">
                                                <input
                                                    type="checkbox"
                                                    checked={filterSettings.selectedEmployees.includes(team.leader)}
                                                    onChange={() => handleEmployeeToggle(team.leader)}
                                                />
                                                <span 
                                                    className="employee-color"
                                                    style={{ 
                                                        backgroundColor: state.employees.find(emp => emp.name === team.leader)?.color || '#cccccc'
                                                    }}
                                                />
                                                <span className="role-icon leader-icon">🎯</span>
                                                <span className="employee-name">{team.leader}</span>
                                                <span className="employee-team">{teamName}</span>
                                                <span className="employee-role">(팀장)</span>
                                            </label>
                                        )}
                                        
                                        {/* 팀원들 */}
                                        {team.members.map(employee => (
                                            <label key={employee.name} className="employee-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={filterSettings.selectedEmployees.includes(employee.name)}
                                                    onChange={() => handleEmployeeToggle(employee.name)}
                                                />
                                                <span 
                                                    className="employee-color"
                                                    style={{ backgroundColor: employee.color }}
                                                />
                                                <span className="employee-name">{employee.name}</span>
                                                <span className="employee-team">{employee.team}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="employee-filter">
            <div className="filter-header">
                <h3 className="filter-title">직원 필터</h3>
                
                <div className="view-mode-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'team' ? 'active' : ''}`}
                        onClick={() => setViewMode('team')}
                    >
                        팀별
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'department' ? 'active' : ''}`}
                        onClick={() => setViewMode('department')}
                    >
                        부서별
                    </button>
                </div>
            </div>

            <div className="filter-controls">
                <button 
                    className="btn btn-small btn-primary"
                    onClick={handleSelectAll}
                >
                    {filterSettings.selectedEmployees.length === state.employees.filter(emp => !emp.hidden).length 
                        ? '전체 해제' : '전체 선택'}
                </button>
                
                <button 
                    className="btn btn-small btn-secondary"
                    onClick={handleResetFilter}
                >
                    필터 초기화
                </button>
            </div>

            <div className="filter-summary">
                선택된 직원: {filterSettings.selectedEmployees.length}명
            </div>

            {viewMode === 'team' ? renderTeamView() : renderDepartmentView()}
        </div>
    );
};

export default EmployeeFilter;

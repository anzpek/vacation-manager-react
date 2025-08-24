import React, { useState, useMemo } from 'react';

const Filter = ({ 
  employees = [], 
  departments = [], 
  selectedFilters = [], 
  onFilterChange, 
  selectedPosition = 'all' 
}) => {
  const [position, setPosition] = useState(selectedPosition);
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  
  // 포지션별 필터링 옵션 - 이모티콘 제거, 심플하게
  const positionOptions = [
    { value: 'all', label: '전체' },
    { value: 'member', label: '팀원' },
    { value: 'leader', label: '팀장' },
    { value: 'manager', label: '부장' }
  ];
  
  // 포지션에 따른 조직 구조
  const organizationData = useMemo(() => {
    if (position === 'manager') {
      // 부장: 부서별로 그룹핑
      return departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        type: 'department',
        employees: employees.filter(emp => 
          emp.department === dept.name && emp.position === 'manager'
        )
      }));
    } else {
      // 팀원, 팀장: 팀별로 그룹핑
      const teamGroups = {};
      
      employees.forEach(emp => {
        if (position !== 'all' && emp.position !== position) return;
        
        if (!teamGroups[emp.team]) {
          teamGroups[emp.team] = {
            id: emp.team,
            name: emp.team,
            type: 'team',
            employees: []
          };
        }
        teamGroups[emp.team].employees.push(emp);
      });
      
      return Object.values(teamGroups);
    }
  }, [employees, departments, position]);
  
  // 부서/팀 확장/축소
  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDepartments(newExpanded);
  };
  
  // 전체 선택/해제
  const handleSelectAll = (groupId, employees) => {
    const employeeIds = employees.map(emp => emp.id);
    const allSelected = employeeIds.every(id => selectedFilters.includes(id));
    
    if (allSelected) {
      // 전체 해제
      const newFilters = selectedFilters.filter(id => !employeeIds.includes(id));
      onFilterChange(newFilters);
    } else {
      // 전체 선택
      const newFilters = [...new Set([...selectedFilters, ...employeeIds])];
      onFilterChange(newFilters);
    }
  };
  
  // 개별 선택/해제
  const handleEmployeeToggle = (employeeId) => {
    if (selectedFilters.includes(employeeId)) {
      onFilterChange(selectedFilters.filter(id => id !== employeeId));
    } else {
      onFilterChange([...selectedFilters, employeeId]);
    }
  };
  
  // 전체 초기화
  const handleClearAll = () => {
    onFilterChange([]);
  };
  
  // 선택된 직원 수 계산
  const selectedCount = selectedFilters.length;
  const totalCount = employees.length;
  
  return (
    <div className="filter-container">
      <div className="filter-header">
        <div className="filter-title">
          <h3>직원 필터</h3>
          <div className="filter-stats">
            <span className="selected-count">
              {selectedCount} / {totalCount}명 선택
            </span>
          </div>
        </div>
        
        <div className="filter-actions">
          <button 
            className="btn btn-secondary btn-small"
            onClick={handleClearAll}
            disabled={selectedCount === 0}
          >
            전체 해제
          </button>
        </div>
      </div>
      
      {/* 포지션 선택 */}
      <div className="position-selector">
        <label className="filter-label">직급별 보기</label>
        <div className="position-tabs">
          {positionOptions.map(option => (
            <button
              key={option.value}
              className={`position-tab ${position === option.value ? 'active' : ''}`}
              onClick={() => setPosition(option.value)}
            >
              <span className="position-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* 조직 구조 */}
      <div className="organization-tree">
        {organizationData.map(group => {
          const isExpanded = expandedDepartments.has(group.id);
          const groupEmployees = group.employees || [];
          const selectedInGroup = groupEmployees.filter(emp => 
            selectedFilters.includes(emp.id)
          ).length;
          const allSelected = groupEmployees.length > 0 && 
            selectedInGroup === groupEmployees.length;
          const partialSelected = selectedInGroup > 0 && selectedInGroup < groupEmployees.length;
          
          return (
            <div key={group.id} className="organization-group">
              <div className="group-header">
                <button
                  className="group-toggle"
                  onClick={() => toggleExpanded(group.id)}
                  aria-label={`${group.name} ${isExpanded ? '접기' : '펼치기'}`}
                >
                  <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>
                    ▶
                  </span>
                </button>
                
                <div className="group-info">
                  <div className="group-name-section">
                    <span className="group-name">{group.name}</span>
                    <span className="employee-count">
                      ({groupEmployees.length}명)
                    </span>
                  </div>
                  
                  <div className="group-selection">
                    <span className="selection-status">
                      {selectedInGroup}/{groupEmployees.length}
                    </span>
                  </div>
                </div>
                
                <button
                  className={`group-select-btn ${
                    allSelected ? 'all-selected' : 
                    partialSelected ? 'partial-selected' : 'none-selected'
                  }`}
                  onClick={() => handleSelectAll(group.id, groupEmployees)}
                  disabled={groupEmployees.length === 0}
                >
                  {allSelected ? '✓' : partialSelected ? '−' : '○'}
                </button>
              </div>
              
              {isExpanded && (
                <div className="employee-list">
                  {groupEmployees.map(employee => {
                    const isSelected = selectedFilters.includes(employee.id);
                    
                    return (
                      <div 
                        key={employee.id} 
                        className={`employee-item ${isSelected ? 'selected' : ''}`}
                      >
                        <button
                          className="employee-toggle"
                          onClick={() => handleEmployeeToggle(employee.id)}
                        >
                          <div className="employee-info">
                            <div className="employee-avatar">
                              {employee.name.charAt(0)}
                            </div>
                            <div className="employee-details">
                              <span className="employee-name">{employee.name}</span>
                              <span className="employee-position">
                                {employee.position === 'member' ? '팀원' :
                                 employee.position === 'leader' ? '팀장' :
                                 employee.position === 'manager' ? '부장' : employee.position}
                              </span>
                            </div>
                          </div>
                          
                          <div className={`employee-checkbox ${isSelected ? 'checked' : ''}`}>
                            {isSelected && '✓'}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                  
                  {groupEmployees.length === 0 && (
                    <div className="empty-group">
                      <span className="empty-message">해당 직급의 직원이 없습니다</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {organizationData.length === 0 && (
          <div className="empty-organization">
            <div className="empty-title">직원이 없습니다</div>
            <div className="empty-description">
              먼저 부서 관리에서 직원을 등록해주세요
            </div>
          </div>
        )}
      </div>
      
      {/* 선택된 직원 목록 (요약) */}
      {selectedCount > 0 && (
        <div className="selected-summary">
          <div className="summary-header">
            <span className="summary-title">선택된 직원</span>
            <button 
              className="summary-clear"
              onClick={handleClearAll}
            >
              모두 해제
            </button>
          </div>
          
          <div className="selected-employees">
            {selectedFilters.slice(0, 5).map(employeeId => {
              const employee = employees.find(emp => emp.id === employeeId);
              if (!employee) return null;
              
              return (
                <div key={employeeId} className="selected-employee-tag">
                  <span className="tag-name">{employee.name}</span>
                  <button 
                    className="tag-remove"
                    onClick={() => handleEmployeeToggle(employeeId)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            
            {selectedCount > 5 && (
              <div className="more-selected">
                +{selectedCount - 5}명 더
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filter;
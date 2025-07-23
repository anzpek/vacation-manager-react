// TeamDragManager.jsx - React DnD 기반 팀 관리 인터페이스
import React, { useCallback, useMemo, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useVacation } from '../../contexts/VacationContext';
import './TeamDragManager.css';

const ItemTypes = {
  EMPLOYEE: 'employee'
};

// 드래그 가능한 직원 카드 컴포넌트
const DraggableEmployee = ({ employee, onPositionChange }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.EMPLOYEE,
    item: () => ({ id: employee.id, currentTeam: employee.team }), // 함수로 변경하여 최신 상태 반영
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [employee.id, employee.team]); // dependency 추가


  const getPositionText = (position) => {
    switch (position) {
      case 'manager': return '부장';
      case 'leader': return '팀장';
      default: return '일반';
    }
  };

  const cyclePosition = () => {
    const positions = ['member', 'leader', 'manager'];
    const currentIndex = positions.indexOf(employee.position);
    const nextPosition = positions[(currentIndex + 1) % positions.length];
    onPositionChange(employee.id, nextPosition);
  };

  return (
    <div
      ref={drag}
      className={`draggable-employee ${isDragging ? 'dragging' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: employee.color || '#f0f0f0',
      }}
    >
      <div className="employee-info">
        <div className="employee-name">{employee.name}</div>
        <button 
          className="position-toggle"
          onClick={cyclePosition}
          title="클릭하여 직급 변경"
        >
          {getPositionText(employee.position)}
        </button>
      </div>
    </div>
  );
};

// 드롭 가능한 팀 박스 컴포넌트
const TeamDropZone = ({ team, employees, onEmployeeMove, onPositionChange }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.EMPLOYEE,
    drop: (item) => {
      if (item.currentTeam !== team) {
        onEmployeeMove(item.id, team);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const teamEmployees = employees.filter(emp => emp.team === team);
  
  // 직급별로 정렬
  const sortedEmployees = useMemo(() => {
    return [...teamEmployees].sort((a, b) => {
      const positionOrder = { 'manager': 0, 'leader': 1, 'member': 2 };
      return positionOrder[a.position] - positionOrder[b.position];
    });
  }, [teamEmployees]);

  return (
    <div
      ref={drop}
      className={`team-drop-zone ${isOver ? 'drag-over' : ''} ${canDrop ? 'can-drop' : ''}`}
    >
      <div className="team-header">
        <h3 className="team-title">
          {team} 
          <span className="employee-count">({teamEmployees.length}명)</span>
        </h3>
      </div>
      
      <div className="team-employees">
        {sortedEmployees.length === 0 ? (
          <div className="empty-team">
            직원을 여기로 드래그하세요
          </div>
        ) : (
          sortedEmployees.map(employee => (
            <DraggableEmployee
              key={employee.id}
              employee={employee}
              onPositionChange={onPositionChange}
            />
          ))
        )}
      </div>
      
      {isOver && canDrop && (
        <div className="drop-indicator">
          여기에 놓으세요
        </div>
      )}
    </div>
  );
};

// 메인 팀 관리 컴포넌트
const TeamDragManager = () => {
  const { state, actions } = useVacation();
  
  // 임시 변경사항을 저장하는 상태
  const [tempEmployees, setTempEmployees] = useState(state.employees);
  const [hasChanges, setHasChanges] = useState(false);

  // 사용 가능한 팀 목록 가져오기
  const availableTeams = useMemo(() => {
    const teamsFromEmployees = [...new Set(tempEmployees.map(emp => emp.team))];
    const teamsFromDepartments = state.departments.map(dept => dept.name);
    return [...new Set([...teamsFromEmployees, ...teamsFromDepartments])].filter(Boolean);
  }, [tempEmployees, state.departments]);

  // 모든 직원 목록 (팀에 소속되지 않은 직원들)
  const unassignedEmployees = useMemo(() => {
    return tempEmployees.filter(emp => !emp.team || emp.team === '');
  }, [tempEmployees]);

  // 직원을 다른 팀으로 이동 (임시 저장)
  const handleEmployeeMove = useCallback((employeeId, newTeam) => {
    setTempEmployees(prev => {
      const updated = prev.map(emp => 
        emp.id === employeeId ? { ...emp, team: newTeam } : emp
      );
      setHasChanges(true);
      return updated;
    });
  }, []);

  // 직원 직급 변경 (임시 저장)
  const handlePositionChange = useCallback((employeeId, newPosition) => {
    setTempEmployees(prev => {
      const updated = prev.map(emp => 
        emp.id === employeeId ? { ...emp, position: newPosition } : emp
      );
      setHasChanges(true);
      return updated;
    });
  }, []);

  // 변경사항 저장
  const handleSaveChanges = useCallback(() => {
    console.log('[TeamDragManager] 변경사항 저장:', tempEmployees.length, '명');
    
    // 전체 직원 데이터를 한번에 저장 (개별 저장 대신 일괄 저장)
    actions.setEmployees(tempEmployees);
    
    setHasChanges(false);
    
    // 변경된 직원 수 계산하여 알림 표시
    const changedEmployees = tempEmployees.filter(tempEmp => {
      const originalEmp = state.employees.find(emp => emp.id === tempEmp.id);
      return originalEmp && (originalEmp.team !== tempEmp.team || originalEmp.position !== tempEmp.position);
    });
    
    console.log('[TeamDragManager] 변경된 직원 수:', changedEmployees.length);
    alert(`팀 관리 변경사항이 저장되었습니다. (${changedEmployees.length}명 변경)`);
  }, [tempEmployees, actions, state.employees]);

  // 변경사항 취소
  const handleCancelChanges = useCallback(() => {
    setTempEmployees(state.employees);
    setHasChanges(false);
  }, [state.employees]);

  // state.employees가 변경되면 tempEmployees 동기화
  React.useEffect(() => {
    if (!hasChanges) {
      setTempEmployees(state.employees);
    }
  }, [state.employees, hasChanges]);

  if (availableTeams.length === 0) {
    return (
      <div className="no-teams-message">
        <div className="message-text">
          먼저 부서를 생성하거나 직원을 추가해주세요.
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="team-drag-manager">
        <div className="manager-header">
          <h2>팀 관리 - 드래그 앤 드롭</h2>
          <div className="header-controls">
            <div className="instructions">
              <div className="instruction-item">
                직원을 드래그해서 팀 간 이동
              </div>
              <div className="instruction-item">
                직급 버튼 클릭으로 직급 변경
              </div>
            </div>
            
            {/* 저장/취소 버튼 */}
            <div className="action-buttons">
              <button 
                className={`save-button ${hasChanges ? 'has-changes' : ''}`}
                onClick={handleSaveChanges}
                disabled={!hasChanges}
              >
                {hasChanges ? '변경사항 저장' : '저장됨'}
              </button>
              <button 
                className="cancel-button"
                onClick={handleCancelChanges}
                disabled={!hasChanges}
              >
                취소
              </button>
            </div>
          </div>
        </div>
        
        <div className="drag-content">
          {/* 전체 직원 목록 - 좌측에 고정 */}
          <div className="all-employees-section">
            <h3>전체 직원 목록</h3>
            <div className="employee-list">
              {tempEmployees.map(employee => (
                <DraggableEmployee
                  key={employee.id}
                  employee={employee}
                  onPositionChange={handlePositionChange}
                />
              ))}
            </div>
          </div>
          
          {/* 팀 박스들 - 우측에 위치 */}
          <div className="teams-section">
            <h3>팀별 관리</h3>
            <div className="teams-grid">
              {availableTeams.map(team => (
                <TeamDropZone
                  key={team}
                  team={team}
                  employees={tempEmployees}
                  onEmployeeMove={handleEmployeeMove}
                  onPositionChange={handlePositionChange}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* 통계 카드들 - 하단에 위치 */}
        <div className="team-stats">
          <div className="stat-card">
            <div className="stat-number">{tempEmployees.length}</div>
            <div className="stat-label">총 직원 수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{availableTeams.length}</div>
            <div className="stat-label">팀 수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {tempEmployees.filter(emp => emp.position === 'manager').length}
            </div>
            <div className="stat-label">부장</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {tempEmployees.filter(emp => emp.position === 'leader').length}
            </div>
            <div className="stat-label">팀장</div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default TeamDragManager;
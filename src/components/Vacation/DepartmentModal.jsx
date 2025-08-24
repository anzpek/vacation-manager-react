// DepartmentModal.jsx - 부서관리 모달
import React, { useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { getNextAvailableColor } from '../../utils/storage';
import './DepartmentModal.css';

const DepartmentModal = () => {
    const { state, actions } = useVacation();
    const { ui } = state;
    
    const [activeTab, setActiveTab] = useState('departments');
    const [newDepartment, setNewDepartment] = useState('');
    const [newTeam, setNewTeam] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [editingDepartmentId, setEditingDepartmentId] = useState(null);
    const [editedDepartmentName, setEditedDepartmentName] = useState('');
    const editInputRef = React.useRef(null);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        department: '',
        team: '',
        role: 'member'
    });

    const handleEmployeeTeamChange = (employeeName, newTeamId) => {
        // 팀을 기반으로 부서도 자동으로 찾아서 설정
        let newDepartmentId = '';
        if (newTeamId) {
            for (const dept of state.departments) {
                if (dept.teams.some(team => team.id === newTeamId)) {
                    newDepartmentId = dept.id;
                    break;
                }
            }
        }
        
        const employees = state.employees.map(emp => {
            if (emp.name === employeeName) {
                return {
                    ...emp,
                    team: newTeamId,
                    department: newDepartmentId
                };
            }
            return emp;
        });
        actions.setEmployees(employees);
    };

    const handleEmployeeRoleChange = (employeeName, newRole) => {
        const employees = state.employees.map(emp => {
            if (emp.name === employeeName) {
                return {
                    ...emp,
                    role: newRole
                };
            }
            return emp;
        });
        actions.setEmployees(employees);
    };

    const handleDeleteDepartment = (departmentId) => {
        const deptName = state.departments.find(d => d.id === departmentId)?.name;
        if (window.confirm(`'${deptName}' 부서를 삭제하시겠습니까? 해당 부서의 모든 팀과 직원도 함께 삭제됩니다.`)) {
            // 부서에 속한 직원들 찾기
            const employeesToDelete = state.employees.filter(emp => emp.department === departmentId);
            
            // 부서 삭제
            const departments = state.departments.filter(d => d.id !== departmentId);
            actions.setDepartments(departments);
            
            // 해당 부서 직원들 삭제
            const employees = state.employees.filter(emp => emp.department !== departmentId);
            actions.setEmployees(employees);
            
            // 해당 직원들의 휴가 기록도 삭제
            const newVacations = { ...state.vacations };
            const employeeNames = employeesToDelete.map(emp => emp.name);
            Object.keys(newVacations).forEach(date => {
                newVacations[date] = newVacations[date].filter(v => !employeeNames.includes(v.employee));
                if (newVacations[date].length === 0) {
                    delete newVacations[date];
                }
            });
            actions.updateVacations(newVacations);
        }
    };

    const handleDeleteTeam = (departmentId, teamId) => {
        const dept = state.departments.find(d => d.id === departmentId);
        const team = dept?.teams.find(t => t.id === teamId);
        if (window.confirm(`'${team?.name}' 팀을 삭제하시겠습니까? 해당 팀의 모든 직원도 함께 삭제됩니다.`)) {
            // 팀에 속한 직원들 찾기
            const employeesToDelete = state.employees.filter(emp => emp.team === teamId);
            
            // 팀 삭제
            const departments = [...state.departments];
            const targetDept = departments.find(d => d.id === departmentId);
            if (targetDept) {
                targetDept.teams = targetDept.teams.filter(t => t.id !== teamId);
                actions.setDepartments(departments);
            }
            
            // 해당 팀 직원들 삭제
            const employees = state.employees.filter(emp => emp.team !== teamId);
            actions.setEmployees(employees);
            
            // 해당 직원들의 휴가 기록도 삭제
            const newVacations = { ...state.vacations };
            const employeeNames = employeesToDelete.map(emp => emp.name);
            Object.keys(newVacations).forEach(date => {
                newVacations[date] = newVacations[date].filter(v => !employeeNames.includes(v.employee));
                if (newVacations[date].length === 0) {
                    delete newVacations[date];
                }
            });
            actions.updateVacations(newVacations);
        }
    };

    const handleAddDepartment = () => {
        if (!newDepartment.trim()) return;
        
        const departments = [...state.departments];
        departments.push({
            id: Date.now().toString(), // 고유 ID 생성
            name: newDepartment,
            manager: null,
            teams: []
        });
        
        actions.setDepartments(departments); // updateDepartments 대신 setDepartments 사용
        setNewDepartment('');
    };

    const handleAddTeam = () => {
        if (!newTeam.trim() || !selectedDepartment) return;
        
        const departments = [...state.departments];
        const dept = departments.find(d => d.id === selectedDepartment);
        
        if (dept) {
            dept.teams.push({
                id: newTeam.toLowerCase().replace(/\s+/g, '_'),
                name: newTeam,
                leader: null,
                members: []
            });
            
            actions.updateDepartments(departments);
            setNewTeam('');
        }
    };

    const handleAddEmployee = () => {
        if (!newEmployee.name.trim()) return;
        
        const employees = [...state.employees];
        const employeeData = state.employees.reduce((acc, emp) => {
            acc[emp.name] = emp;
            return acc;
        }, {});
        
        const newColor = getNextAvailableColor(employeeData);
        
        employees.push({
            id: newEmployee.name.toLowerCase().replace(/\s+/g, ''),
            name: newEmployee.name,
            department: newEmployee.department || 'unknown',
            team: newEmployee.team || 'unknown',
            role: newEmployee.role,
            color: newColor,
            hidden: false
        });
        
        actions.setEmployees(employees);
        setNewEmployee({
            name: '',
            department: '',
            team: '',
            role: 'member'
        });
    };

    const handleDeleteEmployee = (employeeName) => {
        if (window.confirm(`${employeeName}을 삭제하시겠습니까? 관련된 모든 휴가 기록도 함께 삭제됩니다.`)) {
            const employees = state.employees.filter(emp => emp.name !== employeeName);
            actions.setEmployees(employees);
            
            // 해당 직원의 휴가 기록도 삭제
            const newVacations = { ...state.vacations };
            Object.keys(newVacations).forEach(date => {
                newVacations[date] = newVacations[date].filter(v => v.employee !== employeeName);
                if (newVacations[date].length === 0) {
                    delete newVacations[date];
                }
            });
            actions.updateVacations(newVacations);
        }
    };

    const handleEditDepartment = (deptId, currentName) => {
        setEditingDepartmentId(deptId);
        setEditedDepartmentName(currentName);
    };

    const handleSaveDepartment = (deptId) => {
        if (!editedDepartmentName.trim()) {
            alert('부서명은 비워둘 수 없습니다.');
            return;
        }
        const departments = state.departments.map(dept => 
            dept.id === deptId ? { ...dept, name: editedDepartmentName } : dept
        );
        actions.setDepartments(departments); // updateDepartments 대신 setDepartments 사용
        setEditingDepartmentId(null);
        setEditedDepartmentName('');
    };

    const handleCancelEdit = () => {
        setEditingDepartmentId(null);
        setEditedDepartmentName('');
    };

    useEffect(() => {
        if (editingDepartmentId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingDepartmentId]);

    if (!ui.isModalOpen || ui.modalType !== 'department') {
        return null;
    }

    const availableTeams = selectedDepartment ? 
        state.departments.find(d => d.id === selectedDepartment)?.teams || [] : [];

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal department-modal">
                <div className="modal-header">
                    <h2 className="modal-title">부서 및 직원 관리</h2>
                    <button 
                        className="modal-close"
                        onClick={actions.closeModal}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div className="department-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('departments')}
                    >
                        부서 관리
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teams')}
                    >
                        팀 관리
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        직원 관리
                    </button>
                </div>

                <div className="department-content">
                    {activeTab === 'departments' && (
                        <div className="tab-content">
                            <div className="add-section">
                                <h3>부서 추가</h3>
                                <div className="add-form">
                                    <input
                                        type="text"
                                        placeholder="부서명 입력"
                                        value={newDepartment}
                                        onChange={(e) => setNewDepartment(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddDepartment();
                                            }
                                        }}
                                        className="form-input"
                                    />
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleAddDepartment}
                                    >
                                        부서 추가
                                    </button>
                                </div>
                            </div>
                            
                            <div className="list-section">
                                <h3>기존 부서 목록</h3>
                                <div className="department-list">
                                    {state.departments.map(dept => (
                                        <div key={dept.id} className="department-item">
                                            {editingDepartmentId === dept.id ? (
                                                <div className="department-edit-form">
                                                    <input
                                                        type="text"
                                                        ref={editInputRef}
                                                        value={editedDepartmentName}
                                                        onChange={(e) => setEditedDepartmentName(e.target.value)}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveDepartment(dept.id);
                                                            }
                                                        }}
                                                        className="form-input"
                                                    />
                                                    <button 
                                                        className="btn btn-small btn-primary"
                                                        onClick={() => handleSaveDepartment(dept.id)}
                                                    >
                                                        저장
                                                    </button>
                                                    <button 
                                                        className="btn btn-small btn-secondary"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="department-info">
                                                    <span className="department-name">{dept.name}</span>
                                                    <span className="team-count">
                                                        ({dept.teams.length}개 팀, {state.employees.filter(emp => emp.department === dept.id).length}명)
                                                    </span>
                                                </div>
                                            )}
                                            <div className="department-actions">
                                                {editingDepartmentId !== dept.id && (
                                                    <button 
                                                        className="btn btn-small btn-secondary"
                                                        onClick={() => handleEditDepartment(dept.id, dept.name)}
                                                    >
                                                        수정
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn btn-small btn-danger"
                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'teams' && (
                        <div className="tab-content">
                            <div className="add-section">
                                <h3>팀 추가</h3>
                                <div className="add-form">
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">부서 선택</option>
                                        {state.departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="팀명 입력"
                                        value={newTeam}
                                        onChange={(e) => setNewTeam(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTeam();
                                            }
                                        }}
                                        className="form-input"
                                    />
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleAddTeam}
                                        disabled={!selectedDepartment}
                                    >
                                        팀 추가
                                    </button>
                                </div>
                            </div>
                            
                            <div className="list-section">
                                <h3>기존 팀 목록</h3>
                                <div className="team-list">
                                    {state.departments.map(dept => (
                                        <div key={dept.id} className="department-section">
                                            <h4 className="department-header">{dept.name}</h4>
                                            <div className="teams-in-department">
                                                {dept.teams.length === 0 ? (
                                                    <div className="no-teams">팀이 없습니다</div>
                                                ) : (
                                                    dept.teams.map(team => (
                                                        <div key={team.id} className="team-item">
                                                            <div className="team-info">
                                                                <span className="team-name">{team.name}</span>
                                                                <span className="member-count">
                                                                    ({state.employees.filter(emp => emp.team === team.id).length}명)
                                                                </span>
                                                            </div>
                                                            <button 
                                                                className="btn btn-small btn-danger"
                                                                onClick={() => handleDeleteTeam(dept.id, team.id)}
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'employees' && (
                        <div className="tab-content">
                            <div className="add-section">
                                <h3>직원 추가</h3>
                                <div className="add-form employee-form">
                                    <input
                                        type="text"
                                        placeholder="직원명"
                                        value={newEmployee.name}
                                        onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddEmployee();
                                            }
                                        }}
                                        className="form-input"
                                    />
                                    <select
                                        value={newEmployee.team}
                                        onChange={(e) => {
                                            // 팀 선택 시 부서도 자동 설정
                                            let deptId = '';
                                            if (e.target.value) {
                                                for (const dept of state.departments) {
                                                    if (dept.teams.some(team => team.id === e.target.value)) {
                                                        deptId = dept.id;
                                                        break;
                                                    }
                                                }
                                            }
                                            setNewEmployee({
                                                ...newEmployee, 
                                                team: e.target.value,
                                                department: deptId
                                            });
                                        }}
                                        className="form-select"
                                    >
                                        <option value="">팀 선택</option>
                                        {state.departments.map(dept => 
                                            dept.teams.map(team => (
                                                <option key={team.id} value={team.id}>
                                                    {dept.name} - {team.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <select
                                        value={newEmployee.role}
                                        onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                                        className="form-select"
                                    >
                                        <option value="member">팀원</option>
                                        <option value="leader">팀장</option>
                                        <option value="manager">부장</option>
                                    </select>
                                    <button 
                                        className="btn btn-success"
                                        onClick={handleAddEmployee}
                                    >
                                        직원 추가
                                    </button>
                                </div>
                            </div>
                            
                            <div className="list-section">
                                <h3>직원 목록 및 관리</h3>
                                <div className="employee-management-list">
                                    {state.employees.map(emp => {
                                        const empDept = state.departments.find(d => d.id === emp.department);
                                        const empTeam = empDept?.teams.find(t => t.id === emp.team);
                                        
                                        return (
                                            <div key={emp.id} className="employee-management-item">
                                                <div className="employee-basic-info">
                                                    <span 
                                                        className="employee-color"
                                                        style={{ backgroundColor: emp.color }}
                                                    ></span>
                                                    <span className="employee-name">{emp.name}</span>
                                                    <span className="employee-role-badge">
                                                        {emp.role === 'manager' ? '부장' : 
                                                         emp.role === 'leader' ? '팀장' : '팀원'}
                                                    </span>
                                                </div>
                                                
                                                <div className="employee-controls">
                                                    <select
                                                        value={emp.team || ''}
                                                        onChange={(e) => handleEmployeeTeamChange(emp.name, e.target.value)}
                                                        className="form-select-small"
                                                    >
                                                        <option value="">팀 선택</option>
                                                        {state.departments.map(dept => 
                                                            dept.teams.map(team => (
                                                                <option key={team.id} value={team.id}>
                                                                    {dept.name} - {team.name}
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                    
                                                    <select
                                                        value={emp.role || 'member'}
                                                        onChange={(e) => handleEmployeeRoleChange(emp.name, e.target.value)}
                                                        className="form-select-small"
                                                    >
                                                        <option value="member">팀원</option>
                                                        <option value="leader">팀장</option>
                                                        <option value="manager">부장</option>
                                                    </select>
                                                    
                                                    <button 
                                                        className="btn btn-small btn-danger"
                                                        onClick={() => handleDeleteEmployee(emp.name)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={actions.closeModal}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DepartmentModal;

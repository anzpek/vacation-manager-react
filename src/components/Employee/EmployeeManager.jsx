// EmployeeManager.jsx - 모던 디자인 적용
import React, { useState, useCallback, useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './EmployeeManager.css';

const EmployeeManager = React.memo(({ isOpen, onClose }) => {
    const { state, actions } = useVacation();
    const [activeTab, setActiveTab] = useState('employees');
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editingDepartmentId, setEditingDepartmentId] = useState(null);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [newEmployee, setNewEmployee] = useState({
        name: '',
        team: '',
        position: 'member',
        color: null
    });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [editShowColorPicker, setEditShowColorPicker] = useState(false);
    const [newDepartment, setNewDepartment] = useState({
        name: ''
    });

    // 직원 추가
    const handleAddEmployee = useCallback(() => {
        if (!newEmployee.name.trim()) {
            alert('직원 이름을 입력해주세요.');
            return;
        }

        const existingEmployee = (state.employees || []).find(emp => emp.name === newEmployee.name.trim());
        if (existingEmployee) {
            alert('이미 존재하는 직원 이름입니다.');
            return;
        }

        const employeeData = {
            ...newEmployee,
            name: newEmployee.name.trim(),
            team: newEmployee.team || '기타'
        };

        actions.addEmployee(employeeData);

        setNewEmployee({
            name: '',
            team: '',
            position: 'member',
            color: null
        });
    }, [newEmployee, state.employees, actions]);

    // 직원 편집 시작
    const handleEditEmployee = useCallback((employee) => {
        setEditingEmployeeId(employee.id);
        setEditingEmployee({ ...employee });
    }, []);

    // 직원 편집 저장
    const handleSaveEmployee = useCallback(() => {
        if (!editingEmployee.name.trim()) {
            alert('직원 이름을 입력해주세요.');
            return;
        }

        const existingEmployee = state.employees.find(emp => 
            emp.name === editingEmployee.name.trim() && emp.id !== editingEmployee.id
        );
        if (existingEmployee) {
            alert('이미 존재하는 직원 이름입니다.');
            return;
        }

        actions.updateEmployee({
            ...editingEmployee,
            name: editingEmployee.name.trim(),
            team: editingEmployee.team || '기타'
        });

        setEditingEmployeeId(null);
        setEditingEmployee(null);
    }, [editingEmployee, state.employees, actions]);

    // 직원 편집 취소
    const handleCancelEdit = useCallback(() => {
        setEditingEmployeeId(null);
        setEditingEmployee(null);
    }, []);

    // 직원 삭제
    const handleDeleteEmployee = useCallback((employeeId, employeeName) => {
        const vacationCount = state.vacations.filter(v => v.employeeId === employeeId).length;
        const message = vacationCount > 0 
            ? `${employeeName}님을 삭제하면 관련된 휴가 ${vacationCount}건도 함께 삭제됩니다.\n정말 삭제하시겠습니까?`
            : `${employeeName}님을 삭제하시겠습니까?`;

        if (window.confirm(message)) {
            actions.deleteEmployee(employeeId);
        }
    }, [state.vacations, actions]);

    // 부서 추가
    const handleAddDepartment = useCallback(() => {
        if (!newDepartment.name.trim()) {
            alert('부서 이름을 입력해주세요.');
            return;
        }

        const existingDepartment = state.departments.find(dept => dept.name === newDepartment.name.trim());
        if (existingDepartment) {
            alert('이미 존재하는 부서 이름입니다.');
            return;
        }

        const newDept = {
            id: Date.now(),
            name: newDepartment.name.trim()
        };

        actions.setDepartments([...state.departments, newDept]);
        setNewDepartment({ name: '' });
    }, [newDepartment, state.departments, actions]);

    // 부서 편집 시작
    const handleEditDepartment = useCallback((department) => {
        setEditingDepartmentId(department.id);
        setEditingDepartment({ ...department });
    }, []);

    // 부서 편집 저장
    const handleSaveDepartment = useCallback(() => {
        if (!editingDepartment.name.trim()) {
            alert('부서 이름을 입력해주세요.');
            return;
        }

        const existingDepartment = state.departments.find(dept => 
            dept.name === editingDepartment.name.trim() && dept.id !== editingDepartment.id
        );
        if (existingDepartment) {
            alert('이미 존재하는 부서 이름입니다.');
            return;
        }

        const oldDepartmentName = state.departments.find(dept => dept.id === editingDepartment.id)?.name;
        const updatedDepartments = (state.departments || []).map(dept =>
            dept.id === editingDepartment.id 
                ? { ...dept, name: editingDepartment.name.trim() }
                : dept
        );
        actions.setDepartments(updatedDepartments);

        // 해당 부서에 속한 직원들의 팀명도 업데이트
        if (oldDepartmentName && oldDepartmentName !== editingDepartment.name.trim()) {
            const updatedEmployees = (state.employees || []).map(emp =>
                emp.team === oldDepartmentName 
                    ? { ...emp, team: editingDepartment.name.trim() }
                    : emp
            );
            actions.setEmployees(updatedEmployees);
        }

        setEditingDepartmentId(null);
        setEditingDepartment(null);
    }, [editingDepartment, state.departments, state.employees, actions]);

    // 부서 편집 취소
    const handleCancelDepartmentEdit = useCallback(() => {
        setEditingDepartmentId(null);
        setEditingDepartment(null);
    }, []);

    // 부서 삭제
    const handleDeleteDepartment = useCallback((departmentId, departmentName) => {
        const employeeCount = state.employees.filter(emp => emp.team === departmentName).length;
        const message = employeeCount > 0 
            ? `${departmentName} 부서를 삭제하면 소속 직원 ${employeeCount}명의 부서가 '기타'로 변경됩니다.\n정말 삭제하시겠습니까?`
            : `${departmentName} 부서를 삭제하시겠습니까?`;

        if (window.confirm(message)) {
            const updatedDepartments = state.departments.filter(dept => dept.id !== departmentId);
            actions.setDepartments(updatedDepartments);

            if (employeeCount > 0) {
                const updatedEmployees = (state.employees || []).map(emp => 
                    emp.team === departmentName ? { ...emp, team: '기타' } : emp
                );
                actions.setEmployees(updatedEmployees);
            }
        }
    }, [state.employees, state.departments, actions]);

    // 색상 팔레트
    const colorPalette = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];

    // 팀 목록 가져오기
    const availableTeams = useMemo(() => {
        return [...new Set([
            ...(state.departments || []).map(dept => dept.name),
            ...(state.employees || []).map(emp => emp.team),
            '기타'
        ])].filter(Boolean);
    }, [state.departments, state.employees]);

    // Enter 키 처리
    const handleKeyPress = useCallback((e, handler) => {
        if (e.key === 'Enter') {
            handler();
        }
    }, []);

    if (!isOpen) return null;

    return (
        <div className="employee-manager-modal">
            <div className="employee-manager-content">
                <div className="employee-manager-header">
                    <button className="back-to-calendar-btn mobile-only" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>달력</span>
                    </button>
                    <h2 className="employee-manager-title">관리</h2>
                    <button className="close-button" onClick={onClose}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
                
                <div className="employee-manager-body">
                    {/* 탭 메뉴 */}
                    <div className="tab-buttons">
                        <button 
                            className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
                            onClick={() => setActiveTab('employees')}
                        >
                            직원 ({state.employees.length})
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'departments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('departments')}
                        >
                            부서 ({state.departments.length})
                        </button>
                    </div>

                    {/* 직원 관리 탭 */}
                    {activeTab === 'employees' && (
                        <div className="tab-content">
                            <div className="teams-section">
                                {/* 직원 추가 폼 */}
                                <div className="add-team-form">
                                    <div className="form-group">
                                        <label htmlFor="new-employee-name" className="form-label">새 직원 추가</label>
                                        <input
                                            id="new-employee-name"
                                            className="form-input"
                                            type="text"
                                            placeholder="직원 이름"
                                            value={newEmployee.name}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                            onKeyPress={(e) => handleKeyPress(e, handleAddEmployee)}
                                            aria-label="새 직원 이름 입력"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="new-employee-team" className="form-label visually-hidden">부서 선택</label>
                                        <select
                                            id="new-employee-team"
                                            className="select-input"
                                            value={newEmployee.team}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, team: e.target.value })}
                                            aria-label="직원 부서 선택"
                                        >
                                            <option value="">부서 선택</option>
                                            {availableTeams.map(team => (
                                                <option key={team} value={team}>{team}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="new-employee-position" className="form-label visually-hidden">직급 선택</label>
                                        <select
                                            id="new-employee-position"
                                            className="select-input"
                                            value={newEmployee.position}
                                            onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                                            aria-label="직원 직급 선택"
                                        >
                                            <option value="member">일반</option>
                                            <option value="leader">팀장</option>
                                            <option value="manager">부장</option>
                                        </select>
                                    </div>
                                    <div className="color-and-add-row">
                                        <div className="color-selection-wrapper">
                                            <button
                                                type="button"
                                                className={`color-select-button ${newEmployee.color === null ? 'auto' : 'custom'}`}
                                                onClick={() => setShowColorPicker(!showColorPicker)}
                                            >
                                                {newEmployee.color === null ? (
                                                    <span>색상</span>
                                                ) : (
                                                    <>
                                                        <div className="selected-color-dot" style={{ backgroundColor: newEmployee.color }}></div>
                                                        <span>색상</span>
                                                    </>
                                                )}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                            {showColorPicker && (
                                                <div className="color-picker-dropdown">
                                                    <button
                                                        className={`color-auto-option ${newEmployee.color === null ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setNewEmployee({ ...newEmployee, color: null });
                                                            setShowColorPicker(false);
                                                        }}
                                                    >
                                                        자동
                                                    </button>
                                                    <div className="color-options">
                                                        {colorPalette.map(color => (
                                                            <button
                                                                key={color}
                                                                className={`color-dot ${newEmployee.color === color ? 'active' : ''}`}
                                                                style={{ backgroundColor: color }}
                                                                onClick={() => {
                                                                    setNewEmployee({ ...newEmployee, color });
                                                                    setShowColorPicker(false);
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button className="add-button" onClick={handleAddEmployee}>
                                            직원 추가
                                        </button>
                                    </div>
                                </div>

                                {/* 직원 목록 */}
                                <div className="employees-grid">
                                    {(state.employees || []).map(employee => (
                                        <div key={employee.id} className="employee-card">
                                            {editingEmployeeId === employee.id ? (
                                                // 편집 모드
                                                <div className="employee-edit-form">
                                                    <input
                                                        className="form-input"
                                                        type="text"
                                                        value={editingEmployee?.name || ''}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                                                        placeholder="직원 이름"
                                                        aria-label={`직원 이름 편집: ${editingEmployee?.name || ''}`}
                                                    />
                                                    <select
                                                        className="select-input"
                                                        value={editingEmployee?.team || ''}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, team: e.target.value })}
                                                        aria-label="직원 부서 편집"
                                                    >
                                                        {availableTeams.map(team => (
                                                            <option key={team} value={team}>{team}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        className="select-input"
                                                        value={editingEmployee?.position || 'member'}
                                                        onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                                                        aria-label="직원 직급 편집"
                                                    >
                                                        <option value="member">일반</option>
                                                        <option value="leader">팀장</option>
                                                        <option value="manager">부장</option>
                                                    </select>
                                                    <div className="color-selection-wrapper">
                                                        <button
                                                            type="button"
                                                            className={`color-select-button ${editingEmployee?.color === null ? 'auto' : 'custom'}`}
                                                            onClick={() => setEditShowColorPicker(!editShowColorPicker)}
                                                        >
                                                            {editingEmployee?.color === null ? (
                                                                <span>색상</span>
                                                            ) : (
                                                                <>
                                                                    <div className="selected-color-dot" style={{ backgroundColor: editingEmployee?.color }}></div>
                                                                    <span>색상</span>
                                                                </>
                                                            )}
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        </button>
                                                        {editShowColorPicker && (
                                                            <div className="color-picker-dropdown">
                                                                <button
                                                                    className={`color-auto-option ${editingEmployee?.color === null ? 'active' : ''}`}
                                                                    onClick={() => {
                                                                        setEditingEmployee({ ...editingEmployee, color: null });
                                                                        setEditShowColorPicker(false);
                                                                    }}
                                                                >
                                                                    자동
                                                                </button>
                                                                <div className="color-options">
                                                                    {colorPalette.map(color => (
                                                                        <button
                                                                            key={color}
                                                                            className={`color-dot ${editingEmployee?.color === color ? 'active' : ''}`}
                                                                            style={{ backgroundColor: color }}
                                                                            onClick={() => {
                                                                                setEditingEmployee({ ...editingEmployee, color });
                                                                                setEditShowColorPicker(false);
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="edit-actions">
                                                        <button className="btn-small btn-primary" onClick={handleSaveEmployee}>
                                                            저장
                                                        </button>
                                                        <button className="btn-small btn-secondary" onClick={handleCancelEdit}>
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // 표시 모드
                                                <div className="employee-card-content">
                                                    <div className="employee-info-row">
                                                        <div className="employee-name-section">
                                                            {employee.color && (
                                                                <div 
                                                                    className="employee-color-dot" 
                                                                    style={{ backgroundColor: employee.color }}
                                                                />
                                                            )}
                                                            <span className="employee-name">{employee.name}</span>
                                                        </div>
                                                        <div className="employee-actions">
                                                            <button 
                                                                className="btn-icon btn-edit"
                                                                onClick={() => handleEditEmployee(employee)}
                                                                title="수정"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    <path d="m18.5 2.5 3 3L12 15H9v-3L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="btn-icon btn-delete"
                                                                onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                                                                title="삭제"
                                                            >
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    <path d="M10 11v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* 부서 관리 탭 */}
                    {activeTab === 'departments' && (
                        <div className="tab-content">
                            <div className="teams-section">
                                {/* 부서 추가 폼 */}
                                <div className="add-team-form">
                                    <div className="form-group">
                                        <label htmlFor="new-department-name" className="form-label">새 부서 추가</label>
                                        <input
                                            id="new-department-name"
                                            className="form-input"
                                            type="text"
                                            placeholder="부서 이름"
                                            value={newDepartment.name}
                                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                                            onKeyPress={(e) => handleKeyPress(e, handleAddDepartment)}
                                            aria-label="새 부서 이름 입력"
                                        />
                                    </div>
                                    <button className="add-button" onClick={handleAddDepartment}>
                                        부서 추가
                                    </button>
                                </div>

                                {/* 부서 목록 */}
                                <div className="teams-list">
                                    {(state.departments || []).map(department => (
                                        <div key={department.id} className="team-card">
                                            {editingDepartmentId === department.id ? (
                                                // 편집 모드
                                                <div className="team-edit-form">
                                                    <div className="form-group">
                                                        <input
                                                            className="form-input"
                                                            type="text"
                                                            value={editingDepartment?.name || ''}
                                                            onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                                                            placeholder="부서 이름"
                                                            onKeyPress={(e) => handleKeyPress(e, handleSaveDepartment)}
                                                            aria-label={`부서 이름 편집: ${editingDepartment?.name || ''}`}
                                                        />
                                                    </div>
                                                    <div className="edit-actions">
                                                        <button className="btn-small btn-primary" onClick={handleSaveDepartment}>
                                                            저장
                                                        </button>
                                                        <button className="btn-small btn-secondary" onClick={handleCancelDepartmentEdit}>
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                // 표시 모드
                                                <div className="team-header">
                                                    <h3 className="team-name">{department.name}</h3>
                                                    <div className="team-stats">
                                                        <span className="stat-badge">
                                                            직원 {state.employees.filter(emp => emp.team === department.name).length}명
                                                        </span>
                                                        <button 
                                                            className="btn-small btn-secondary"
                                                            onClick={() => handleEditDepartment(department)}
                                                        >
                                                            수정
                                                        </button>
                                                        <button 
                                                            className="delete-team-button"
                                                            onClick={() => handleDeleteDepartment(department.id, department.name)}
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

EmployeeManager.displayName = 'EmployeeManager';

export default EmployeeManager;
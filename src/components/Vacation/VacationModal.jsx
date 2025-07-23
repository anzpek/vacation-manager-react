// VacationModal.jsx - 새로운 모달 시스템 사용
import React, { useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { formatDateToKorean } from '../../utils/dateUtils';
import Modal from '../Common/Modal';
import './VacationModal.css';

// 연휴 날짜 선택 컴포넌트
const ConsecutiveVacationSelector = ({ consecutiveGroup, selectedEmployee, formData, setFormData, formatDateToKorean }) => {
    const [selectedDate, setSelectedDate] = useState(formData.date);
    
    // 연휴 기간의 모든 날짜 생성
    const getVacationDates = () => {
        const dates = [];
        const start = new Date(consecutiveGroup.startDate);
        const end = new Date(consecutiveGroup.endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD 형식
            dates.push({
                date: dateStr,
                formatted: formatDateToKorean(dateStr)
            });
        }
        return dates;
    };
    
    const vacationDates = getVacationDates();
    
    // 초기 선택된 날짜가 연휴 기간에 없으면 첫 번째 날짜로 설정
    React.useEffect(() => {
        if (!selectedDate || !vacationDates.some(d => d.date === selectedDate)) {
            const firstDate = vacationDates[0]?.date;
            if (firstDate) {
                setSelectedDate(firstDate);
                setFormData(prev => ({ ...prev, date: firstDate }));
            }
        }
    }, [vacationDates, selectedDate, setFormData]);
    
    const handleDateSelect = (dateStr) => {
        setSelectedDate(dateStr);
        
        // 선택된 날짜에 해당하는 휴가 정보 찾기
        const vacationForSelectedDate = consecutiveGroup.vacations.find(v => v.date === dateStr);
        
        if (vacationForSelectedDate) {
            console.log('[VacationModal] 🎯 선택된 날짜의 휴가 정보:', { 
                id: vacationForSelectedDate.id, 
                date: vacationForSelectedDate.date, 
                type: vacationForSelectedDate.type 
            });
            setFormData(prev => ({
                ...prev,
                id: vacationForSelectedDate.id, // 🔧 핵심 수정: ID도 함께 설정
                date: dateStr,
                type: vacationForSelectedDate.type,
                description: vacationForSelectedDate.description || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, date: dateStr }));
        }
    };
    
    return (
        <div className="edit-context-info">
            <div className="context-header">
                <h4>연휴 기간 - 수정할 날짜 선택</h4>
                <p className="context-subtitle">
                    {selectedEmployee?.name}님의 연휴 ({formatDateToKorean(consecutiveGroup.startDate)} ~ {formatDateToKorean(consecutiveGroup.endDate)})
                </p>
            </div>
            <div className="consecutive-date-selector">
                {vacationDates.map(({ date, formatted }) => (
                    <label key={date} className={`date-option ${selectedDate === date ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="consecutiveDate"
                            value={date}
                            checked={selectedDate === date}
                            onChange={() => handleDateSelect(date)}
                        />
                        <div className="date-option-content">
                            <span className="date-text">{formatted}</span>
                        </div>
                    </label>
                ))}
            </div>
            <div className="context-details">
                <div className="context-item">
                    <span className="context-label">현재 유형:</span>
                    <span className="context-value">{formData.type}</span>
                </div>
            </div>
        </div>
    );
};

const VacationModal = () => {
    const { state, actions } = useVacation();
    const { ui, employees } = state;
    
    const [formData, setFormData] = useState({
        id: null,
        date: '',
        employeeId: '',
        type: '연차',
        description: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 수정 모드인지 확인
    const isEditMode = ui.activeModal === 'editVacation';
    
    // 모달이 열릴 때 데이터 초기화
    useEffect(() => {
        if (ui.activeModal === 'vacation' || ui.activeModal === 'editVacation') {
            if (ui.activeModal === 'editVacation' && ui.modalProps && ui.modalProps.vacation) {
                const { vacation } = ui.modalProps;
                setFormData({
                    id: vacation.id,
                    date: vacation.date,
                    employeeId: vacation.employeeId,
                    type: vacation.type,
                    description: vacation.description || ''
                });
            } else if (ui.selectedDate) {
                // 날짜를 로컬 시간대 기준으로 정확히 포맷팅
                const year = ui.selectedDate.getFullYear();
                const month = String(ui.selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(ui.selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                setFormData({
                    id: null,
                    date: dateStr,
                    employeeId: '',
                    type: '연차',
                    description: ''
                });
            }
        }
        setErrors({});
    }, [ui.activeModal, ui.selectedDate, ui.modalProps]);

    // 충돌 감지
    useEffect(() => {
        if (formData.date && formData.employeeId) {
            const conflicts = actions.detectConflicts(formData);
            
            // 연휴 내에서 날짜 변경하는 경우는 충돌이 아님
            const { consecutiveGroup } = ui.modalProps || {};
            const isConsecutiveEdit = isEditMode && consecutiveGroup && consecutiveGroup.isConsecutive;
            
            let hasRealConflict = false;
            
            if (conflicts.length > 0) {
                if (isConsecutiveEdit) {
                    // 연휴 수정 시: 현재 연휴 그룹에 속하지 않는 휴가와의 충돌만 체크
                    hasRealConflict = conflicts.some(conflict => {
                        const conflictInConsecutiveGroup = consecutiveGroup.vacations.some(v => v.id === conflict.id);
                        return !conflictInConsecutiveGroup; // 연휴 그룹에 속하지 않는 충돌만 실제 충돌
                    });
                } else {
                    // 일반 수정/추가 시: 자신이 아닌 다른 휴가와의 충돌 체크
                    hasRealConflict = conflicts.some(conflict => conflict.id !== formData.id);
                }
            }
            
            if (hasRealConflict) {
                setErrors(prev => ({ ...prev, conflict: '이미 해당 날짜에 휴가가 있습니다.' }));
            } else {
                setErrors(prev => ({ ...prev, conflict: null }));
            }
        }
    }, [formData.date, formData.employeeId, actions, formData.id, isEditMode, ui.modalProps]);

    const vacationTypes = [
        { value: '연차', label: '연차', color: '#4285f4' },
        { value: '오전', label: '오전반차', color: '#34a853' },
        { value: '오후', label: '오후반차', color: '#fbbc04' },
        { value: '특별', label: '특별휴가', color: '#ea4335' },
        { value: '병가', label: '병가', color: '#9aa0a6' },
        { value: '업무', label: '업무일정', color: '#674ea7' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // 에러 메시지 클리어
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.date) newErrors.date = '날짜를 선택해주세요.';
        if (!formData.employeeId) newErrors.employeeId = '직원을 선택해주세요.';
        if (!formData.type) newErrors.type = '휴가 유형을 선택해주세요.';
        if (errors.conflict) newErrors.conflict = errors.conflict;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // employeeId를 숫자로 변환하여 데이터 정합성 확보
            const vacationData = {
                ...formData,
                employeeId: parseInt(formData.employeeId)
            };
            
            console.log('🎯 휴가 저장 시작:', JSON.stringify(vacationData, null, 2));
            console.log('🎯 저장 전 현재 휴가 개수:', state.vacations.length);
            
            // 저장 전 데이터 검증
            const employee = employees.find(emp => emp.id === vacationData.employeeId);
            if (!employee) {
                throw new Error(`직원을 찾을 수 없습니다. ID: ${vacationData.employeeId}`);
            }
            
            console.log('🎯 휴가 저장 대상 직원:', employee.name);
            
            if (isEditMode) {
                actions.updateVacation(vacationData);
                console.log('🎯 휴가 수정 완료 - 연속휴가 자동 재계산됨');
            } else {
                const savedVacation = actions.addVacation(vacationData);
                console.log('🎯 휴가 추가 완료:', savedVacation);
                
                // 추가 후 바로 검증
                setTimeout(() => {
                    // 올바른 storage key 사용
                    const currentDepartment = JSON.parse(localStorage.getItem('currentDepartment') || '{}');
                    const storageKey = `vacations_${currentDepartment.code || 'default'}`;
                    const updatedVacations = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const addedVacation = updatedVacations.find(v => v.id === savedVacation.id);
                    console.log('🎯 추가된 휴가 localStorage 확인:', addedVacation);
                }, 100);
            }
            
            actions.setModal(null);
        } catch (error) {
            console.error('휴가 저장 오류:', error);
            if (error.message.includes('존재하지 않는 직원')) {
                setErrors({ submit: `오류: ${error.message}` });
            } else {
                setErrors({ submit: '저장 중 오류가 발생했습니다.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSingleDay = () => {
        console.log('[VacationModal] 🗑️ handleDeleteSingleDay 시작');
        console.log('[VacationModal] 📋 삭제할 휴가 정보:', { 
            id: formData.id, 
            date: formData.date, 
            employeeId: formData.employeeId, 
            type: formData.type 
        });
        console.log('[VacationModal] 👤 선택된 직원:', { 
            id: selectedEmployee?.id, 
            name: selectedEmployee?.name 
        });
        
        const dateStr = formatDateToKorean(formData.date);
        const confirmMessage = dateStr ? 
            `${selectedEmployee.name}님의 ${dateStr} 휴가를 삭제하시겠습니까?` :
            `${selectedEmployee.name}님의 해당 날짜 휴가를 삭제하시겠습니까?`;
            
        if (window.confirm(confirmMessage)) {
            console.log('[VacationModal] ✅ 사용자 확인 - 삭제 진행:', formData.id);
            actions.deleteVacationDay(formData.id, formData.date);
            actions.setModal(null);
        } else {
            console.log('[VacationModal] ❌ 사용자 취소 - 삭제 중단');
        }
    };

    const handleDeleteEntireVacation = () => {
        const { consecutiveGroup } = ui.modalProps || {};
        if (consecutiveGroup && consecutiveGroup.isConsecutive && consecutiveGroup.startDate && consecutiveGroup.endDate) {
            const startDateStr = formatDateToKorean(consecutiveGroup.startDate);
            const endDateStr = formatDateToKorean(consecutiveGroup.endDate);
            
            let confirmMessage;
            if (startDateStr && endDateStr) {
                confirmMessage = `${selectedEmployee.name}님의 연휴 전체 (${startDateStr} ~ ${endDateStr})를 삭제하시겠습니까?`;
            } else {
                confirmMessage = `${selectedEmployee.name}님의 연휴 전체를 삭제하시겠습니까?`;
            }
            
            if (window.confirm(confirmMessage)) {
                actions.deleteConsecutiveVacations(consecutiveGroup.startDate, consecutiveGroup.endDate, consecutiveGroup.employeeId);
                actions.setModal(null);
            }
        } else {
            if (window.confirm(`${selectedEmployee.name}님의 모든 ${formData.type} 휴가를 삭제하시겠습니까?`)) {
                actions.deleteVacation(formData.id);
                actions.setModal(null);
            }
        }
    };

    const handleClose = () => {
        actions.setModal(null);
        setFormData({
            id: null,
            date: '',
            employeeId: '',
            type: '연차',
            description: ''
        });
        setErrors({});
    };

    const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);

    if (ui.activeModal !== 'vacation' && ui.activeModal !== 'editVacation') {
        return null;
    }

    const getModalTitle = () => {
        if (!isEditMode) return '휴가 등록';
        
        const { consecutiveGroup } = ui.modalProps || {};
        if (consecutiveGroup && consecutiveGroup.isConsecutive && consecutiveGroup.startDate && consecutiveGroup.endDate) {
            const startDateStr = formatDateToKorean(consecutiveGroup.startDate);
            const endDateStr = formatDateToKorean(consecutiveGroup.endDate);
            if (startDateStr && endDateStr) {
                return `휴가 수정 - 연휴 (${startDateStr} ~ ${endDateStr})`;
            }
        }
        
        if (formData.date) {
            const dateStr = formatDateToKorean(formData.date);
            if (dateStr) {
                return `휴가 수정 - ${dateStr}`;
            }
        }
        
        return '휴가 수정';
    };

    return (
        <Modal isOpen={true} onClose={handleClose} title={getModalTitle()}>
            <div className="vacation-modal-content">
                {isEditMode && ui.modalProps && (() => {
                    const { consecutiveGroup } = ui.modalProps;
                    const isConsecutiveVacation = consecutiveGroup && consecutiveGroup.isConsecutive && consecutiveGroup.startDate && consecutiveGroup.endDate;
                    
                    if (isConsecutiveVacation) {
                        // 연휴인 경우 - 개별 날짜 선택 UI
                        return <ConsecutiveVacationSelector 
                            consecutiveGroup={consecutiveGroup}
                            selectedEmployee={selectedEmployee}
                            formData={formData}
                            setFormData={setFormData}
                            formatDateToKorean={formatDateToKorean}
                        />;
                    } else {
                        // 단일 휴가인 경우 - 간단한 정보만 표시
                        return (
                            <div className="edit-context-info">
                                <div className="context-header">
                                    <h4>수정 중인 휴가</h4>
                                </div>
                                <div className="context-details">
                                    <div className="context-item">
                                        <span className="context-label">현재 유형:</span>
                                        <span className="context-value">{formData.type}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })()}
                
                <form onSubmit={handleSubmit} className="vacation-form">
                    <div className="form-field">
                        <label className="field-label">
                            <span className="label-text">휴가 날짜</span>
                        </label>
                        <div className="input-wrapper">
                            {isEditMode && ui.modalProps?.consecutiveGroup?.isConsecutive ? (
                                // 연휴인 경우: 선택된 날짜를 읽기 전용으로 표시
                                <div className="selected-date-display">
                                    <div className="date-display-content">
                                        <span className="date-display-text">
                                            {formatDateToKorean(formData.date) || '날짜를 선택하세요'}
                                        </span>
                                        <span className="date-display-note">
                                            위에서 수정할 날짜를 선택하세요
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                // 단일 휴가이거나 새 휴가인 경우: 날짜 입력 가능
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className={`modern-input ${errors.date ? 'error' : ''}`}
                                    required
                                />
                            )}
                            {errors.date && (
                                <div className="error-message">
                                    {errors.date}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">
                            <span className="label-text">직원 선택</span>
                        </label>
                        <div className="input-wrapper">
                            <select
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                className={`modern-select ${errors.employeeId ? 'error' : ''}`}
                                required
                                disabled={false} // 직원 변경 항상 가능
                            >
                                <option value="">직원을 선택하세요</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name} ({employee.team})
                                    </option>
                                ))}
                            </select>
                            {selectedEmployee && !isEditMode && (
                                <div className="selected-employee-preview">
                                    <div className="employee-avatar">
                                        {selectedEmployee.name.charAt(0)}
                                    </div>
                                    <div className="employee-info">
                                        <span className="employee-name">{selectedEmployee.name}</span>
                                        <span className="employee-team">{selectedEmployee.team}</span>
                                    </div>
                                </div>
                            )}
                            {errors.employeeId && (
                                <div className="error-message">
                                    {errors.employeeId}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">
                            <span className="label-text">휴가 유형</span>
                        </label>
                        <div className="input-wrapper">
                            <div className="vacation-type-grid">
                                {vacationTypes.map((type) => (
                                    <label 
                                        key={type.value} 
                                        className={`vacation-type-card ${formData.type === type.value ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name="type"
                                            value={type.value}
                                            checked={formData.type === type.value}
                                            onChange={handleInputChange}
                                            className="type-radio"
                                        />
                                        <div 
                                            className="type-indicator"
                                            style={{ backgroundColor: type.color }}
                                        ></div>
                                        <span className="type-label">{type.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.type && (
                                <div className="error-message">
                                    {errors.type}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-field">
                        <label className="field-label">
                            <span className="label-text">설명 (선택사항)</span>
                        </label>
                        <div className="input-wrapper">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="modern-textarea"
                                placeholder="휴가 사유나 추가 정보를 입력하세요..."
                                rows="3"
                            />
                        </div>
                    </div>

                    {errors.conflict && (
                        <div className="alert alert-warning">
                            <span className="alert-text">{errors.conflict}</span>
                        </div>
                    )}

                    {errors.submit && (
                        <div className="alert alert-error">
                            <span className="alert-text">{errors.submit}</span>
                        </div>
                    )}
                </form>
            </div>

            <div className="vacation-modal-footer">
                <div className="footer-actions">
                    {isEditMode && (() => {
                        const { consecutiveGroup } = ui.modalProps || {};
                        const isConsecutiveVacation = consecutiveGroup && consecutiveGroup.isConsecutive && consecutiveGroup.startDate && consecutiveGroup.endDate;
                        
                        return (
                            <>
                                <button
                                    type="button"
                                    onClick={handleDeleteSingleDay}
                                    className="action-button delete-button"
                                    disabled={isSubmitting}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <span className="button-text">
                                        {isConsecutiveVacation ? '선택된 날짜 삭제' : '휴가 삭제'}
                                    </span>
                                </button>
                                
                                {/* 연휴일 때만 전체 삭제 버튼 표시 */}
                                {isConsecutiveVacation && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteEntireVacation}
                                        className="action-button delete-button"
                                        disabled={isSubmitting}
                                        title={(() => {
                                            const startDateStr = formatDateToKorean(consecutiveGroup.startDate);
                                            const endDateStr = formatDateToKorean(consecutiveGroup.endDate);
                                            return startDateStr && endDateStr ? 
                                                `연휴 전체 (${startDateStr} ~ ${endDateStr}) 삭제` : 
                                                '연휴 전체 삭제';
                                        })()}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        <span className="button-text">연휴 전체 삭제</span>
                                    </button>
                                )}
                            </>
                        );
                    })()}
                    
                    <div className="primary-actions">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="action-button cancel-button"
                            disabled={isSubmitting}
                        >
                            <span className="button-text">취소</span>
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="action-button submit-button"
                            disabled={isSubmitting || !!errors.conflict}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span className="button-text">
                                {isSubmitting ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default VacationModal;
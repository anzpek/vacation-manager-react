import React from 'react';
import { useVacation } from '../../contexts/VacationContext';
import './DayVacationsModal.css';

const DayVacationsModal = ({ isOpen, onClose, data }) => {
    const { actions } = useVacation();
    
    if (!data) {
        return null;
    }
    
    // 기본값 설정
    const modalData = {
        date: data.date || new Date().toISOString().split('T')[0],
        vacations: data.vacations || [],
        employees: data.employees || []
    };
    
    const { date, vacations = [], employees = [] } = modalData;
    
    // 날짜 포맷팅 (구글 캘린더 스타일)
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][date.getDay()];
        return { day, dayOfWeek };
    };
    
    const formatFullDate = (dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}월 ${day}일`;
    };
    
    // 휴가 타입별 스타일 (아이콘 제거)
    const getVacationTypeInfo = (type) => {
        switch (type) {
            case '연차': 
                return { 
                    backgroundColor: '#4285F4', 
                    color: 'white',
                    label: '연차'
                };
            case '오전': 
                return { 
                    backgroundColor: '#FF9800', 
                    color: 'white',
                    label: '오전 반차'
                };
            case '오후': 
                return { 
                    backgroundColor: '#FF9800', 
                    color: 'white',
                    label: '오후 반차'
                };
            case '특별': 
                return { 
                    backgroundColor: '#0F9D58', 
                    color: 'white',
                    label: '특별휴가'
                };
            case '병가': 
                return { 
                    backgroundColor: '#EA4335', 
                    color: 'white',
                    label: '병가'
                };
            case '업무': 
                return { 
                    backgroundColor: '#9C27B0', 
                    color: 'white',
                    label: '업무'
                };
            default: 
                return { 
                    backgroundColor: '#9E9E9E', 
                    color: 'white',
                    label: type
                };
        }
    };
    
    // 직원 정보 가져오기
    const getEmployeeInfo = (employeeId) => {
        return employees.find(emp => emp.id === employeeId) || { name: '알 수 없음', color: '#6B7280' };
    };
    
    // 휴가 편집 핸들러
    const handleEditVacation = (vacation) => {
        const employee = getEmployeeInfo(vacation.employeeId);
        actions.openModal('editVacation', {
            date: date,
            vacation: vacation,
            employee: employee
        });
    };
    
    // 새 휴가 추가 핸들러
    const handleAddVacation = () => {
        actions.openModal('addVacation', {
            date: date,
            employee: null,
            type: '연차'
        });
    };
    
    const { day, dayOfWeek } = formatDate(date);
    
    return (
        <div className="google-modal-overlay" onClick={onClose}>
            <div className="google-day-modal" onClick={(e) => e.stopPropagation()}>
                {/* 구글 캘린더 스타일 헤더 */}
                <div className="google-modal-header">
                    <div className="google-date-section">
                        <div className="google-day-number">{day}</div>
                        <div className="google-day-name">{dayOfWeek}</div>
                    </div>
                    <div className="google-header-actions">
                        <button className="google-close-btn" onClick={onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 구글 캘린더 스타일 구분선 */}
                <div className="google-modal-divider"></div>
                
                {/* 날짜 표시 */}
                <div className="google-date-info">
                    <span className="google-date-text">한국 6월 {day}일</span>
                </div>

                {/* 휴가 목록 */}
                <div className="google-events-list">
                    {vacations.map((vacation, index) => {
                        const employee = getEmployeeInfo(vacation.employeeId);
                        const typeInfo = getVacationTypeInfo(vacation.type);
                        
                        return (
                            <div key={`${vacation.employeeId}-${vacation.type}-${index}`} className="google-event-item">
                                <div className="google-event-time-indicator">
                                    <div 
                                        className="google-event-color-bar"
                                        style={{ backgroundColor: typeInfo.backgroundColor }}
                                    ></div>
                                </div>
                                
                                <div 
                                    className="google-event-content"
                                    onClick={() => handleEditVacation(vacation)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="google-event-title">
                                        <span className="google-event-name">{employee.name}</span>
                                    </div>
                                    <div className="google-event-subtitle">
                                        {typeInfo.label}
                                        {vacation.description && ` • ${vacation.description}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 구글 캘린더 스타일 하단 추가 버튼 */}
                <div className="google-modal-footer">
                    <button className="google-add-event-btn" onClick={handleAddVacation}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                        </svg>
                        <span>{formatFullDate(date)}에 추가</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DayVacationsModal;
// EnhancedCalendar.jsx - 연속 휴가 막대바와 직원별 행 배치가 포함된 고급 달력 컴포넌트
import React, { useState, useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { 
    getCalendarDays, 
    isSameMonth, 
    formatDateToYYYYMMDD,
    formatDateToKorean 
} from '../../utils/dateUtils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './EnhancedCalendar.css';

const EnhancedCalendar = () => {
    const { state, actions, computed } = useVacation();
    const { selectedYear, selectedMonth } = state;
    const [viewMode, setViewMode] = useState('row');

    const calendarDays = getCalendarDays(selectedYear, selectedMonth);
    const filteredEmployees = computed.getFilteredEmployees();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    const consecutiveVacations = useMemo(() => {
        console.log('🗓️ EnhancedCalendar vacations 업데이트:', state.vacations.length);
        const consecutiveData = {};
        
        filteredEmployees.forEach(employee => {
            const employeeId = employee.id;
            consecutiveData[employeeId] = [];
            
            const vacations = state.vacations
                .filter(v => v.employeeId === employeeId && 
                            new Date(v.date).getFullYear() === selectedYear && 
                            new Date(v.date).getMonth() === selectedMonth)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let currentStreak = null;
            
            vacations.forEach(vacation => {
                const currentDate = new Date(vacation.date);
                
                if (!currentStreak) {
                    currentStreak = {
                        id: vacation.id,
                        startDate: vacation.date,
                        endDate: vacation.date,
                        type: vacation.type,
                        description: vacation.description,
                        employeeId: vacation.employeeId
                    };
                } else {
                    const lastDate = new Date(currentStreak.endDate);
                    const nextDay = new Date(lastDate);
                    nextDay.setDate(nextDay.getDate() + 1);
                    
                    if (currentDate.getTime() === nextDay.getTime()) {
                        currentStreak.endDate = vacation.date;
                        if (vacation.type !== currentStreak.type) {
                            currentStreak.type = '연차'; 
                        }
                    } else {
                        consecutiveData[employeeId].push(currentStreak);
                        currentStreak = {
                            id: vacation.id,
                            startDate: vacation.date,
                            endDate: vacation.date,
                            type: vacation.type,
                            description: vacation.description,
                            employeeId: vacation.employeeId
                        };
                    }
                }
            });
            
            if (currentStreak) {
                consecutiveData[employeeId].push(currentStreak);
            }
        });
        
        return consecutiveData;
    }, [filteredEmployees, selectedYear, selectedMonth, state.vacations]);

    const getDatePosition = (date) => {
        return calendarDays.findIndex(d => 
            formatDateToYYYYMMDD(d) === formatDateToYYYYMMDD(new Date(date))
        );
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) {
            return;
        }

        const [employeeName, vacationId] = draggableId.split('-');
        const vacation = consecutiveVacations[employeeName]?.find(v => v.startDate === vacationId);

        if (vacation) {
            const sourceDate = calendarDays[source.index];
            const destinationDate = calendarDays[destination.index];
            const dateDiff = (destinationDate.getTime() - sourceDate.getTime()) / (1000 * 3600 * 24);

            const newStartDate = new Date(vacation.startDate);
            newStartDate.setDate(newStartDate.getDate() + dateDiff);

            const updatedVacation = {
                ...vacation,
                id: vacation.id, // Ensure id is passed to update action
                date: newStartDate.toISOString().split('T')[0],
            };
            actions.updateVacation(updatedVacation);
        }
    };

    // 휴가 막대 클릭 핸들러
    const handleVacationBarClick = (employeeId, vacation) => {
        if (vacation.type === '업무' && vacation.description) {
            const message = `${state.employees.find(emp => emp.id === employeeId)?.name}님의 업무 일정\n기간: ${formatDateToKorean(new Date(vacation.startDate))}${vacation.startDate !== vacation.endDate ? ` ~ ${formatDateToKorean(new Date(vacation.endDate))}` : ''}\n\n📋 업무 내용: ${vacation.description}\n\n수정하시겠습니까?`;
            if (window.confirm(message)) {
                actions.setModal('editVacation', {
                    id: vacation.id,
                    date: vacation.startDate,
                    employeeId: employeeId,
                    type: vacation.type,
                    description: vacation.description
                });
            }
        } else {
            actions.setModal('editVacation', {
                id: vacation.id,
                date: vacation.startDate,
                employeeId: employeeId,
                type: vacation.type,
                description: vacation.description || ''
            });
        }
    };

    // 휴가 유형별 색상 클래스
    const getVacationTypeClass = (type) => {
        switch (type) {
            case '연차': return 'vacation-annual';
            case '오전': return 'vacation-morning';
            case '오후': return 'vacation-afternoon';
            case '특별': return 'vacation-special';
            case '병가': return 'vacation-sick';
            case '업무': return 'vacation-work';
            default: return 'vacation-annual';
        }
    };

    // 직원 색상 가져오기
    const getEmployeeColor = (employeeId) => {
        const employee = filteredEmployees.find(emp => emp.id === employeeId);
        return employee ? employee.color || '#CCCCCC' : '#CCCCCC';
    };

    // 날짜 셀 클릭 핸들러
    const handleDateClick = (dateString) => {
        const clickedDate = new Date(dateString);
        actions.setModal('vacation', clickedDate);
    };

    if (state.ui.isLoading) {
        return (
            <div className="calendar-loading">
                <div className="spinner"></div>
                <p>달력을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div className="enhanced-calendar-container">
            <div className="calendar-header">
                <div className="calendar-info">
                    <span className="employee-count">
                        표시된 직원: {filteredEmployees.length}명
                    </span>
                </div>
                <div className="view-controls">
                    <button 
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        📋 격자 보기
                    </button>
                    <button 
                        className={`view-btn ${viewMode === 'row' ? 'active' : ''}`}
                        onClick={() => setViewMode('row')}
                    >
                        📊 연속 막대 보기
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                {viewMode === 'row' ? (
                    <Droppable droppableId="calendar-rows" direction="vertical">
                        {(provided) => (
                            <div 
                                className="row-calendar-body"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {filteredEmployees.map((employee, index) => (
                                    <Draggable key={employee.id} draggableId={String(employee.id)} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="employee-row"
                                            >
                                                <div className="employee-info">
                                                    <span className="employee-name">{employee.name}</span>
                                                    <span className="employee-team">{employee.team || '미지정'}</span>
                                                </div>
                                                
                                                <div className="employee-calendar-row">
                                                    {/* 날짜별 셀 배경 */}
                                                    <div className="date-cells-background">
                                                        {calendarDays.map((date, idx) => {
                                                            const dateString = formatDateToYYYYMMDD(date);
                                                            const isCurrentMonth = isSameMonth(date, selectedYear, selectedMonth);
                                                            const dayOfWeek = date.getDay();
                                                            
                                                            return (
                                                                <div 
                                                                    key={`bg-${dateString}`}
                                                                    className={`date-cell-bg ${
                                                                        !isCurrentMonth ? 'other-month' : ''
                                                                    } ${dayOfWeek === 0 ? 'sunday' : ''} ${
                                                                        dayOfWeek === 6 ? 'saturday' : ''
                                                                    }`}
                                                                    onClick={() => isCurrentMonth && handleDateClick(dateString)}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {/* 연속 휴가 막대들 */}
                                                    <div className="vacation-bars-container">
                                                        {consecutiveVacations[employee.id]?.map((vacation, idx) => {
                                                            const startPos = getDatePosition(vacation.startDate);
                                                            const endPos = getDatePosition(vacation.endDate);
                                                            const width = endPos - startPos + 1;
                                                            const left = startPos;
                                                            
                                                            if (startPos === -1 || endPos === -1) return null;
                                                            
                                                            return (
                                                                <div
                                                                    key={`vacation-${vacation.id}`}
                                                                    className={`vacation-bar ${getVacationTypeClass(vacation.type)}`}
                                                                    style={{
                                                                        left: `${(left / calendarDays.length) * 100}%`,
                                                                        width: `${(width / calendarDays.length) * 100}%`,
                                                                        backgroundColor: getEmployeeColor(vacation.employeeId),
                                                                        borderColor: getEmployeeColor(vacation.employeeId)
                                                                    }}
                                                                    onClick={() => handleVacationBarClick(vacation.employeeId, vacation)}
                                                                    title={`${vacation.type}${vacation.description ? ` - ${vacation.description}` : ''}`}
                                                                >
                                                                    <span className="vacation-bar-text">
                                                                        {vacation.type}
                                                                        {vacation.description && vacation.type === '업무' && (
                                                                            <span className="work-description">
                                                                                : {vacation.description}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                ) : (
                    /* 기존 격자 보기 */
                    <div className="calendar">
                        {/* 요일 헤더 */}
                        <div className="calendar-weekdays">
                            {weekDays.map((day, index) => (
                                <div 
                                    key={day} 
                                    className={`weekday ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* 날짜 그리드 */}
                        <div className="calendar-grid">
                            {calendarDays.map((date, index) => {
                                const dateString = formatDateToYYYYMMDD(date);
                                const isCurrentMonth = isSameMonth(date, selectedYear, selectedMonth);
                                const dayOfWeek = date.getDay();
                                const dayVacations = computed.getVacationsByDate(dateString);
                                
                                return (
                                    <div
                                        key={dateString}
                                        className={`calendar-day ${
                                            !isCurrentMonth ? 'other-month' : ''
                                        } ${dayOfWeek === 0 ? 'sunday' : ''} ${
                                            dayOfWeek === 6 ? 'saturday' : ''
                                        } ${dayVacations.length > 0 ? 'has-vacation' : ''}`}
                                        onClick={() => isCurrentMonth && handleDateClick(dateString)}
                                    >
                                        <div className="day-header">
                                            <span className="day-number">{date.getDate()}</span>
                                        </div>

                                        <div className="day-content">
                                            {/* 휴가 표시 */}
                                            {dayVacations.map((vacation, idx) => (
                                                <div
                                                    key={`vacation-${vacation.id}`}
                                                    className={`vacation-item ${getVacationTypeClass(vacation.type)}`}
                                                    style={{ 
                                                        backgroundColor: getEmployeeColor(vacation.employeeId),
                                                        borderColor: getEmployeeColor(vacation.employeeId)
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleVacationBarClick(vacation.employeeId, {
                                                            startDate: dateString,
                                                            endDate: dateString,
                                                            type: vacation.type,
                                                            description: vacation.description,
                                                            id: vacation.id
                                                        });
                                                    }}
                                                    title={`${state.employees.find(emp => emp.id === vacation.employeeId)?.name} - ${vacation.type}${vacation.description ? ` (${vacation.description})` : ''}`}
                                                >
                                                    <span className="vacation-employee">
                                                        {state.employees.find(emp => emp.id === vacation.employeeId)?.name}
                                                    </span>
                                                    <span className="vacation-type">
                                                        {vacation.type}
                                                    </span>
                                                </div>
                                            ))}
                                            
                                            {/* 빈 날짜에 플러스 아이콘 표시 */}
                                            {isCurrentMonth && dayVacations.length === 0 && (
                                                <div className="add-vacation-hint">
                                                    <span className="plus-icon">+</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </DragDropContext>

            {/* 범례 */}
            <div className="calendar-legend">
                <div className="legend-title">일정 유형</div>
                <div className="legend-items">
                    <div className="legend-item">
                        <span className="legend-color vacation-annual"></span>
                        <span>연차</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color vacation-morning"></span>
                        <span>오전</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color vacation-afternoon"></span>
                        <span>오후</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color vacation-special"></span>
                        <span>특별</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color vacation-sick"></span>
                        <span>병가</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-color vacation-work"></span>
                        <span>업무</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedCalendar;
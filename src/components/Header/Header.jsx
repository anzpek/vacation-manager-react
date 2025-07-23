// Header.jsx - 모던 헤더 컴포넌트 (테마 토글 기능 추가)
import React, { useCallback, useMemo, useState } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMonthName } from '../../utils/dateUtils';
import AccountModal from '../Account/AccountModal';
import './Header.css';

const Header = ({ user, onLogout }) => {
    const { state, actions } = useVacation();
    const { theme, toggleTheme, getThemeIcon, getThemeLabel, setSpecificTheme } = useTheme();
    const { currentDepartment, logout } = useAuth();
    const { selectedYear, selectedMonth } = state;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

    const handlePrevMonth = useCallback(() => {
        if (selectedMonth === 0) {
            actions.setSelectedDate(selectedYear - 1, 11);
        } else {
            actions.setSelectedDate(selectedYear, selectedMonth - 1);
        }
    }, [selectedYear, selectedMonth, actions]);

    const handleNextMonth = useCallback(() => {
        if (selectedMonth === 11) {
            actions.setSelectedDate(selectedYear + 1, 0);
        } else {
            actions.setSelectedDate(selectedYear, selectedMonth + 1);
        }
    }, [selectedYear, selectedMonth, actions]);

    const handleToday = useCallback(() => {
        const today = new Date();
        actions.setSelectedDate(today.getFullYear(), today.getMonth());
    }, [actions]);

    const handleYearChange = useCallback((e) => {
        const newYear = parseInt(e.target.value);
        actions.setSelectedDate(newYear, selectedMonth);
    }, [selectedMonth, actions]);

    const handleMonthChange = useCallback((e) => {
        const newMonth = parseInt(e.target.value);
        actions.setSelectedDate(selectedYear, newMonth);
    }, [selectedYear, actions]);


    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const years = useMemo(() => Array.from({ length: 10 }, (_, i) => currentYear - 5 + i), [currentYear]);
    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);


    return (
        <header className="modern-header">
            <div className="header-container">
                {/* 모바일 계정 및 로그아웃 버튼 - 맨 우측 상단 */}
                <div className="mobile-user-buttons">
                    <button 
                        className="mobile-account-btn-top"
                        onClick={() => setIsAccountModalOpen(true)}
                        title="계정 관리"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                    <button 
                        className="mobile-logout-btn-top"
                        onClick={() => {
                            logout();
                            if (onLogout) onLogout();
                        }}
                        title="로그아웃"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* 모바일 단순 헤더 - 로고 + 타이틀만 */}
                <div className="mobile-simple-header">
                    <div className="mobile-title-section">
                        <div className="logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M8 2v3M16 2v3M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="mobile-main-title">휴가관리시스템</h1>
                            <p className="mobile-department-name" style={{ 
                                color: currentDepartment?.color || '#666'
                            }}>
                                {currentDepartment?.name || '부서 미선택'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 모바일 액션 버튼 */}
                <div className="mobile-action-buttons">
                    <button 
                        className="mobile-action-btn"
                        onClick={() => actions.setModal('batchInput')}
                        title="텍스트 일괄 입력"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span>일괄입력</span>
                    </button>
                    
                    <button 
                        className="mobile-action-btn"
                        onClick={() => actions.setModal('employeeManager')}
                        title="직원 및 부서 관리"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>부서관리</span>
                    </button>
                    
                    <button 
                        className="mobile-action-btn"
                        onClick={() => actions.toggleFilter()}
                        title="필터 설정"
                    >
                        <span>필터</span>
                    </button>
                    
                    <button 
                        className="mobile-action-btn theme-btn"
                        onClick={toggleTheme}
                        title={`현재: ${theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '시스템 설정'}`}
                    >
                        <span>{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</span>
                    </button>
                </div>

                {/* 모바일 달력 네비게이션 */}
                <div className="mobile-calendar-nav">
                    <div className="mobile-date-picker">
                        <button className="nav-button" onClick={handlePrevMonth}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        
                        <div className="date-selectors">
                            <select value={selectedYear} onChange={handleYearChange} className="year-select">
                                {years.map(year => (
                                    <option key={year} value={year}>{year}년</option>
                                ))}
                            </select>
                            <select value={selectedMonth} onChange={handleMonthChange} className="month-select">
                                {months.map(month => (
                                    <option key={month} value={month}>{getMonthName(month)}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button className="nav-button" onClick={handleNextMonth}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Desktop Left: Logo & Title */}
                <div className="header-left desktop-only">
                    <div className="logo-container">
                        <div className="logo-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M8 2v3M16 2v3M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <div className="title-section">
                            <h1 className="main-title">휴가관리시스템</h1>
                            <p className="department-name" style={{ 
                                color: currentDepartment?.color || '#666'
                            }}>
                                {currentDepartment?.name || '부서 미선택'}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Desktop Right: Action Buttons */}
                <div className="header-right desktop-only">
                    <div className="action-buttons">
                        <button 
                            className="action-button batch-input-button"
                            onClick={() => actions.setModal('batchInput')}
                            title="텍스트 일괄 입력"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>일괄입력</span>
                        </button>
                        
                        <button 
                            className="action-button employee-manage-button"
                            onClick={() => actions.setModal('employeeManager')}
                            title="직원 및 부서 관리"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>부서관리</span>
                        </button>
                        
                        <button 
                            className="action-button today-button"
                            onClick={handleToday}
                            title="오늘로 이동"
                        >
                            <span>오늘</span>
                        </button>
                    </div>
                    
                    {/* Theme Toggle */}
                    <div className="theme-toggle">
                        <button 
                            className="theme-button"
                            onClick={toggleTheme}
                            title={`현재: ${theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '시스템 설정'}`}
                        >
                            <span className="theme-icon">{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</span>
                        </button>
                    </div>
                    
                    {/* User Menu */}
                    <div className="user-section">
                        <button 
                            className="user-avatar"
                            onClick={() => setIsAccountModalOpen(true)}
                            title="계정 관리"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                        <button 
                            className="logout-button"
                            onClick={() => {
                                logout();
                                if (onLogout) onLogout();
                            }}
                            title="로그아웃"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>로그아웃</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* 계정 관리 모달 */}
            <AccountModal 
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
            />

        </header>
    );
};

export default Header;
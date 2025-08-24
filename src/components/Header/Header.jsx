// Header.jsx - 모던 헤더 컴포넌트 (테마 토글 기능 추가)
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMonthName } from '../../utils/dateUtils.ts';
import AccountModal from '../Account/AccountModal';
import './Header.css';

const Header = ({ user, onLogout }) => {
    const { state, actions } = useVacation();
    const { theme, toggleTheme, getThemeIcon, getThemeLabel, setSpecificTheme } = useTheme();
    const { currentDepartment, logout } = useAuth();
    const { selectedYear, selectedMonth } = state;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // 뷰포트 크기 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        <>
            <header className="modern-header">
                {/* 모바일 헤더 - 모바일에서만 렌더링 */}
                {isMobile && (
                <div className="mobile-header">
                    {/* 좌측: 버거 메뉴 */}
                    <button 
                        className="burger-menu-btn"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="메뉴 열기"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* 중앙: 달력 네비게이션 */}
                    <div className="mobile-nav-container">
                        <button className="nav-btn" onClick={handlePrevMonth}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                        
                        <div className="mobile-date-display" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}>
                            <span className="date-text">{selectedYear}년 {getMonthName(selectedMonth)}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="dropdown-icon">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <button className="nav-btn" onClick={handleNextMonth}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* 우측: 계정 버튼 */}
                    <button 
                        className="account-btn"
                        onClick={() => setIsAccountModalOpen(true)}
                        aria-label="계정 관리"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
                )}

                {/* 날짜 선택 드롭다운 - 모바일에서만 */}
                {isMobile && isDatePickerOpen && (
                    <>
                        <div className="date-picker-backdrop" onClick={() => setIsDatePickerOpen(false)} />
                        <div className="date-picker-dropdown">
                            <div className="date-picker-content">
                                <div className="date-picker-selects">
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
                                <div className="date-picker-actions">
                                    <button onClick={handleToday} className="today-btn">오늘</button>
                                    <button onClick={() => setIsDatePickerOpen(false)} className="confirm-btn">확인</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* 데스크톱 헤더 - PC에서만 렌더링 */}
                {!isMobile && (
                <div className="desktop-header">
                    <div className="header-left">
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

                    <div className="header-center">
                        <div className="date-navigation">
                            <button className="nav-button" onClick={handlePrevMonth}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            
                            <div className="date-selectors">
                                <select 
                                    className="year-selector" 
                                    value={selectedYear} 
                                    onChange={handleYearChange}
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}년</option>
                                    ))}
                                </select>
                                <select 
                                    className="month-selector" 
                                    value={selectedMonth} 
                                    onChange={handleMonthChange}
                                >
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

                    <div className="header-right">
                        <div className="action-buttons">
                            <button 
                                className="action-button"
                                onClick={() => actions.setModal('batchInput')}
                                title="텍스트 일괄 입력"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                <span>일괄입력</span>
                            </button>
                            
                            <button 
                                className="action-button"
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
                                className="action-button"
                                onClick={handleToday}
                                title="오늘로 이동"
                            >
                                <span>오늘</span>
                            </button>
                        </div>
                        
                        <div className="theme-toggle header-theme-toggle">
                            <button 
                                className="theme-button header-theme-button"
                                onClick={toggleTheme}
                                title={`현재: ${theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '시스템 설정'}`}
                                aria-label="테마 변경"
                            >
                                <span className="theme-icon">{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</span>
                            </button>
                        </div>
                        
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
                )}
            </header>

            {/* 모바일 사이드바 - 모바일에서만 */}
            {isMobile && isSidebarOpen && (
                <>
                    <div 
                        className="sidebar-backdrop"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <div className="mobile-sidebar">
                        <div className="sidebar-header">
                            <div className="sidebar-title">
                                <div className="logo-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 2v3M16 2v3M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </div>
                                <div>
                                    <h2>휴가관리시스템</h2>
                                    <p style={{ color: currentDepartment?.color || '#666' }}>
                                        {currentDepartment?.name || '부서 미선택'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                className="sidebar-close"
                                onClick={() => setIsSidebarOpen(false)}
                                aria-label="메뉴 닫기"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>

                        <div className="sidebar-content">
                            <div className="sidebar-menu">
                                <button 
                                    className="sidebar-menu-item"
                                    onClick={() => {
                                        actions.setModal('batchInput');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <span>일괄 입력</span>
                                </button>

                                <button 
                                    className="sidebar-menu-item"
                                    onClick={() => {
                                        actions.setModal('employeeManager');
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 14l9-5-9-5-9 5 9 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>부서 관리</span>
                                </button>

                                <button 
                                    className="sidebar-menu-item"
                                    onClick={() => {
                                        actions.toggleMobileFilter();
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>필터</span>
                                </button>

                                <button 
                                    className="sidebar-menu-item"
                                    onClick={() => {
                                        toggleTheme();
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>{theme === 'light' ? '라이트 모드' : theme === 'dark' ? '다크 모드' : '자동 모드'}</span>
                                </button>

                                <div className="sidebar-divider" />

                                <button 
                                    className="sidebar-menu-item logout"
                                    onClick={() => {
                                        logout();
                                        if (onLogout) onLogout();
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    <span>로그아웃</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 계정 관리 모달 */}
            <AccountModal 
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
            />
        </>
    );
};

export default Header;
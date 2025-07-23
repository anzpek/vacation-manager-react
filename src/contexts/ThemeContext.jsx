// ThemeContext.jsx - 다크/라이트 테마 전환 컨텍스트
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { currentDepartment } = useAuth();
  
  // 로컬스토리지에서 테마 가져오기 (기본값: light)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('vacation-theme');
    return savedTheme || 'light';
  });

  // 시스템 다크모드 감지
  const [systemTheme, setSystemTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // 실제 적용될 테마 계산
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // DOM에 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // CSS 변수 설정
    const root = document.documentElement;
    
    if (effectiveTheme === 'dark') {
      // 다크 테마 CSS 변수
      root.style.setProperty('--background-primary', '#1e1e1e');
      root.style.setProperty('--background-secondary', '#2a2a2a');
      root.style.setProperty('--background-hover', '#404040');
      root.style.setProperty('--background-accent', '#505050');
      root.style.setProperty('--border-color', '#333333');
      root.style.setProperty('--border-color-light', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--primary-color', '#4285f4');
      root.style.setProperty('--primary-dark', '#3367d6');
      root.style.setProperty('--success-color', '#34a853');
      root.style.setProperty('--error-color', '#ea4335');
      root.style.setProperty('--warning-color', '#fbbc04');
      root.style.setProperty('--info-color', '#4285f4');
      
      // 달력 및 공휴일 관련 색상 (다크모드)
      root.style.setProperty('--holiday-bg', 'rgba(255, 71, 87, 0.15)');
      root.style.setProperty('--holiday-border', 'rgba(255, 71, 87, 0.3)');
      root.style.setProperty('--holiday-day-bg', 'rgba(255, 71, 87, 0.08)');
      root.style.setProperty('--holiday-border-color', '#ff6b87');
      root.style.setProperty('--holiday-text-color', '#ff6b87');
      root.style.setProperty('--holiday-name-bg', 'rgba(30, 30, 30, 0.95)');
      root.style.setProperty('--holiday-row-bg', 'rgba(255, 71, 87, 0.12)');
      
      // 휴가 유형별 색상 (다크모드에서 조금 더 밝게)
      root.style.setProperty('--vacation-annual-color', 'rgba(74, 172, 255, 0.8)');
      root.style.setProperty('--vacation-morning-color', 'rgba(175, 119, 202, 0.8)');
      root.style.setProperty('--vacation-afternoon-color', 'rgba(255, 146, 64, 0.8)');
      root.style.setProperty('--vacation-special-color', 'rgba(255, 96, 80, 0.8)');
      root.style.setProperty('--vacation-sick-color', 'rgba(169, 185, 186, 0.8)');
      root.style.setProperty('--vacation-work-color', 'rgba(82, 103, 124, 0.8)');
      
      // 달력 날짜 관련 추가 색상 (다크모드)
      root.style.setProperty('--primary-bg', 'rgba(66, 133, 244, 0.15)');
      root.style.setProperty('--primary-bg-hover', 'rgba(66, 133, 244, 0.2)');
      root.style.setProperty('--vacation-day-bg', 'rgba(66, 133, 244, 0.05)');
    } else {
      // 라이트 테마 CSS 변수
      root.style.setProperty('--background-primary', '#ffffff');
      root.style.setProperty('--background-secondary', '#f8f9fa');
      root.style.setProperty('--background-hover', '#f0f0f0');
      root.style.setProperty('--background-accent', '#e0e0e0');
      root.style.setProperty('--border-color', '#e0e0e0');
      root.style.setProperty('--border-color-light', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--primary-color', '#4285f4');
      root.style.setProperty('--primary-dark', '#3367d6');
      root.style.setProperty('--success-color', '#34a853');
      root.style.setProperty('--error-color', '#ea4335');
      root.style.setProperty('--warning-color', '#fbbc04');
      root.style.setProperty('--info-color', '#3498db');
      
      // 달력 및 공휴일 관련 색상 (라이트모드)
      root.style.setProperty('--holiday-bg', 'rgba(255, 71, 87, 0.1)');
      root.style.setProperty('--holiday-border', 'rgba(255, 71, 87, 0.2)');
      root.style.setProperty('--holiday-day-bg', 'rgba(255, 71, 87, 0.05)');
      root.style.setProperty('--holiday-border-color', '#ff4757');
      root.style.setProperty('--holiday-text-color', '#ff4757');
      root.style.setProperty('--holiday-name-bg', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--holiday-row-bg', 'rgba(255, 71, 87, 0.08)');
      
      // 휴가 유형별 색상 (라이트모드 원본)
      root.style.setProperty('--vacation-annual-color', 'rgba(52, 152, 219, 0.8)');
      root.style.setProperty('--vacation-morning-color', 'rgba(155, 89, 182, 0.8)');
      root.style.setProperty('--vacation-afternoon-color', 'rgba(230, 126, 34, 0.8)');
      root.style.setProperty('--vacation-special-color', 'rgba(231, 76, 60, 0.8)');
      root.style.setProperty('--vacation-sick-color', 'rgba(149, 165, 166, 0.8)');
      root.style.setProperty('--vacation-work-color', 'rgba(52, 73, 94, 0.8)');
      
      // 달력 날짜 관련 추가 색상 (라이트모드)
      root.style.setProperty('--primary-bg', 'rgba(66, 133, 244, 0.1)');
      root.style.setProperty('--primary-bg-hover', 'rgba(66, 133, 244, 0.15)');
      root.style.setProperty('--vacation-day-bg', 'rgba(66, 133, 244, 0.03)');
    }
  }, [effectiveTheme]);

  // Firebase와 테마 동기화
  const saveThemeToFirebase = async (themeValue) => {
    if (currentDepartment) {
      try {
        const { database, ref, set } = await import('../utils/firebase');
        if (database) {
          const themeRef = ref(database, `users/${currentDepartment.code}/theme`);
          await set(themeRef, themeValue);
          console.log('🎨 테마 설정 Firebase에 저장됨');
        }
      } catch (error) {
        console.error('테마 Firebase 저장 실패:', error);
      }
    }
  };

  // Firebase에서 테마 불러오기
  const loadThemeFromFirebase = async () => {
    if (currentDepartment) {
      try {
        const { database, ref, get } = await import('../utils/firebase');
        if (database) {
          const themeRef = ref(database, `users/${currentDepartment.code}/theme`);
          const snapshot = await get(themeRef);
          if (snapshot.exists()) {
            const firebaseTheme = snapshot.val();
            setTheme(firebaseTheme);
            localStorage.setItem('vacation-theme', firebaseTheme);
            console.log('🎨 Firebase에서 테마 설정 불러옴');
          }
        }
      } catch (error) {
        console.error('테마 Firebase 로드 실패:', error);
      }
    }
  };

  // 로그인 시 테마 로드
  useEffect(() => {
    if (currentDepartment) {
      loadThemeFromFirebase();
    }
  }, [currentDepartment]);

  // 테마 변경 함수
  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
    localStorage.setItem('vacation-theme', nextTheme);
    saveThemeToFirebase(nextTheme);
  };

  // 특정 테마로 설정
  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('vacation-theme', newTheme);
      saveThemeToFirebase(newTheme);
    }
  };

  // 테마 아이콘 반환
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return '💻';
      default:
        return '☀️';
    }
  };

  // 테마 레이블 반환
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '라이트 모드';
      case 'dark':
        return '다크 모드';
      case 'system':
        return '시스템 설정';
      default:
        return '라이트 모드';
    }
  };

  const value = {
    theme,
    effectiveTheme,
    systemTheme,
    toggleTheme,
    setSpecificTheme,
    getThemeIcon,
    getThemeLabel,
    isLight: effectiveTheme === 'light',
    isDark: effectiveTheme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
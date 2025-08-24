import React from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../Header/Header';
import MainContent from './MainContent';

function Dashboard() {
  const { state } = useVacation();
  const { currentUser, logout } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--background-secondary, #f8fafc)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* 모던 헤더 (테마 토글 포함) */}
      <Header user={currentUser} onLogout={logout} />

      {/* 메인 컨텐츠 */}
      <MainContent />

      {/* 로딩 상태 */}
      {state.ui.loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div>로딩 중...</div>
          </div>
        </div>
      )}

      {/* 에러 토스트 */}
      {state.ui.error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          {state.ui.error}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
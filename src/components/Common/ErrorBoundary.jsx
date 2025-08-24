import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary 캐치:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '20px' }}>
            🚨 앱에서 오류가 발생했습니다
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            페이지를 새로고침하거나 잠시 후 다시 시도해보세요.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            페이지 새로고침
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '20px', width: '100%', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: '#6c757d' }}>
                개발자 정보 (클릭하여 펼치기)
              </summary>
              <pre style={{ 
                textAlign: 'left', 
                backgroundColor: '#f8f9fa', 
                padding: '10px', 
                borderRadius: '5px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
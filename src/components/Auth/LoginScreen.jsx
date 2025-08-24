import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginScreen.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인하세요.');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="glass-card-strong login-form">
        <h2 className="heading-2 text-center mb-8">부서 로그인</h2>
        
        {error && <div className="error-banner mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-6">
            <label className="block body-regular mb-2">부서 이메일</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="department@company.com"
              className="w-full p-3 glass-card"
              required
            />
          </div>

          <div className="form-group mb-8">
            <label className="block body-regular mb-2">비밀번호</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full p-3 glass-card"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full glass-button bg-primary-gradient text-white font-bold"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;

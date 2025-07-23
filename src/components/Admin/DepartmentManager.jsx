// DepartmentManager.jsx - 부서 관리 모달 컴포넌트
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './DepartmentManager.css';

const DepartmentManager = ({ isOpen, onClose }) => {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    color: '#4285f4',
    password: ''
  });

  // 색상 옵션
  const colorOptions = [
    '#4285f4', '#34a853', '#ff6b6b', '#ffbb33',
    '#9c27b0', '#00bcd4', '#ff5722', '#607d8b',
    '#795548', '#e91e63', '#3f51b5', '#009688'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      color: '#4285f4',
      password: ''
    });
    setEditingDept(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim() || !formData.password.trim()) {
      showError('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    // 부서 코드 중복 검사 (편집 중이 아닌 경우)
    if (!editingDept && departments.some(dept => dept.code === formData.code)) {
      showError('입력 오류', '이미 존재하는 부서 코드입니다.');
      return;
    }

    try {
      if (editingDept) {
        // 부서 수정
        await updateDepartment(editingDept.code, formData);
        showSuccess('부서 수정', `${formData.name} 부서가 수정되었습니다.`);
      } else {
        // 새 부서 추가
        await addDepartment(formData);
        showSuccess('부서 생성', `${formData.name} 부서가 생성되었습니다.`);
      }
      resetForm();
    } catch (error) {
      showError('처리 실패', error.message);
    }
  };

  const handleEdit = (dept) => {
    setFormData({
      name: dept.name,
      code: dept.code,
      color: dept.color,
      password: dept.password
    });
    setEditingDept(dept);
    setShowAddForm(true);
  };

  const handleDelete = async (deptCode, deptName) => {
    if (window.confirm(`정말로 ${deptName} 부서를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        await deleteDepartment(deptCode);
        showSuccess('부서 삭제', `${deptName} 부서가 삭제되었습니다.`);
      } catch (error) {
        showError('삭제 실패', error.message);
      }
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: result }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="department-manager" onClick={e => e.stopPropagation()}>
        <div className="manager-header">
          <h2 className="manager-title">🏢 부서/팀 관리</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="manager-content">
          {!showAddForm ? (
            <>
              {/* 부서 목록 */}
              <div className="department-list">
                <div className="list-header">
                  <h3>등록된 부서/팀 ({departments.length}개)</h3>
                  <button 
                    className="add-button"
                    onClick={() => setShowAddForm(true)}
                  >
                    + 새 부서 추가
                  </button>
                </div>

                {departments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🏢</div>
                    <div className="empty-text">등록된 부서가 없습니다</div>
                    <button 
                      className="empty-action"
                      onClick={() => setShowAddForm(true)}
                    >
                      첫 번째 부서 만들기
                    </button>
                  </div>
                ) : (
                  <div className="department-cards">
                    {departments.map((dept) => (
                      <div key={dept.code} className="dept-card">
                        <div className="dept-card-header">
                          <div className="dept-info">
                            <div 
                              className="dept-color-indicator"
                              style={{ backgroundColor: dept.color }}
                            ></div>
                            <div className="dept-details">
                              <div className="dept-name">{dept.name}</div>
                              <div className="dept-code">ID: {dept.code}</div>
                            </div>
                          </div>
                          <div className="dept-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEdit(dept)}
                              title="수정"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(dept.code, dept.name)}
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="dept-card-body">
                          <div className="dept-credential">
                            <span className="credential-label">로그인 정보:</span>
                            <span className="credential-value">
                              {dept.code} / {dept.password}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 부서 추가/수정 폼 */}
              <div className="add-form">
                <div className="form-header">
                  <h3>{editingDept ? '부서 수정' : '새 부서 추가'}</h3>
                  <button className="back-btn" onClick={resetForm}>
                    ← 목록으로
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="deptName">부서/팀 이름 *</label>
                      <input
                        type="text"
                        id="deptName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="예: 개발팀, 마케팅부"
                        className="form-input"
                        maxLength={20}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="deptCode">부서 코드 *</label>
                      <input
                        type="text"
                        id="deptCode"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                        placeholder="예: dev, marketing"
                        className="form-input"
                        maxLength={10}
                        disabled={editingDept}
                      />
                      <div className="form-help">
                        로그인 ID로 사용됩니다. 소문자, 숫자만 입력 가능합니다.
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="deptColor">부서 색상</label>
                      <div className="color-picker">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="deptPassword">부서 비밀번호 *</label>
                      <div className="password-input">
                        <input
                          type="text"
                          id="deptPassword"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="부서 로그인 비밀번호"
                          className="form-input"
                          maxLength={20}
                        />
                        <button
                          type="button"
                          className="generate-btn"
                          onClick={generatePassword}
                          title="랜덤 비밀번호 생성"
                        >
                          🎲
                        </button>
                      </div>
                      <div className="form-help">
                        이 비밀번호로 해당 부서에서 로그인합니다.
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={resetForm}>
                      취소
                    </button>
                    <button type="submit" className="submit-btn">
                      {editingDept ? '수정 완료' : '부서 생성'}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentManager;
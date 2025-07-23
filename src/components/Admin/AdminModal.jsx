// AdminModal.jsx - 관리자 시스템 모달
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminModal.css';

const AdminModal = ({ isOpen, onClose }) => {
    const { departments, updateDepartmentPassword } = useAuth();
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 관리자 비밀번호 (실제 운영에서는 보안 강화 필요)
    const ADMIN_PASSWORD = 'admin2025!';

    const resetForm = useCallback(() => {
        setSelectedDepartment('');
        setNewPassword('');
        setConfirmPassword('');
        setAdminPassword('');
        setError('');
        setSuccess('');
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!selectedDepartment || !newPassword || !confirmPassword || !adminPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (adminPassword !== ADMIN_PASSWORD) {
            setError('관리자 비밀번호가 올바르지 않습니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 4) {
            setError('비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await updateDepartmentPassword(selectedDepartment, newPassword);
            setSuccess(`${departments.find(d => d.code === selectedDepartment)?.name} 비밀번호가 성공적으로 변경되었습니다.`);
            
            // 3초 후 폼 리셋
            setTimeout(() => {
                resetForm();
            }, 3000);
        } catch (error) {
            setError(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDepartment, newPassword, confirmPassword, adminPassword, departments, updateDepartmentPassword, resetForm]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal admin-modal">
                <div className="modal-header">
                    <h2 className="modal-title">🔧 관리자 시스템</h2>
                    <button 
                        className="modal-close"
                        onClick={handleClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form className="admin-form" onSubmit={handleSubmit}>
                    <div className="admin-content">
                        <div className="form-section">
                            <h3>부서 비밀번호 변경</h3>
                            <p className="section-description">
                                선택한 부서의 로그인 비밀번호를 변경할 수 있습니다.
                            </p>

                            <div className="form-group">
                                <label htmlFor="department">변경할 부서</label>
                                <select
                                    id="department"
                                    className="form-input"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    disabled={isLoading}
                                >
                                    <option value="">부서를 선택하세요</option>
                                    {departments.map((dept) => (
                                        <option key={dept.code} value={dept.code}>
                                            {dept.name} ({dept.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedDepartment && (
                                <div className="current-info">
                                    <div className="dept-info-card" style={{ '--dept-color': departments.find(d => d.code === selectedDepartment)?.color }}>
                                        <div className="dept-icon" style={{ backgroundColor: departments.find(d => d.code === selectedDepartment)?.color }}>
                                            {departments.find(d => d.code === selectedDepartment)?.name.charAt(0)}
                                        </div>
                                        <div className="dept-details">
                                            <div className="dept-name">{departments.find(d => d.code === selectedDepartment)?.name}</div>
                                            <div className="current-password">
                                                현재 비밀번호: <code>{departments.find(d => d.code === selectedDepartment)?.password}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="newPassword">새 비밀번호</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    className="form-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="새 비밀번호를 입력하세요"
                                    disabled={isLoading || !selectedDepartment}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className="form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                    disabled={isLoading || !selectedDepartment}
                                />
                            </div>

                            <div className="form-group admin-auth">
                                <label htmlFor="adminPassword">관리자 비밀번호</label>
                                <input
                                    type="password"
                                    id="adminPassword"
                                    className="form-input admin-input"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="관리자 인증을 위한 비밀번호"
                                    disabled={isLoading}
                                />
                                <div className="admin-hint">
                                    💡 힌트: admin2025!
                                </div>
                            </div>
                        </div>

                        {/* 상태 메시지 */}
                        {error && (
                            <div className="message error-message">
                                <span className="message-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="message success-message">
                                <span className="message-icon">✅</span>
                                {success}
                            </div>
                        )}

                        {/* 부서 목록 미리보기 */}
                        <div className="departments-preview">
                            <h3>현재 부서 목록</h3>
                            <div className="departments-grid">
                                {departments.map((dept) => (
                                    <div key={dept.code} className="dept-preview-card">
                                        <div className="dept-icon-small" style={{ backgroundColor: dept.color }}>
                                            {dept.name.charAt(0)}
                                        </div>
                                        <div className="dept-preview-info">
                                            <div className="dept-preview-name">{dept.name}</div>
                                            <div className="dept-preview-code">{dept.code}</div>
                                            <div className="dept-preview-password">
                                                비밀번호: <code>{dept.password}</code>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            취소
                        </button>
                        
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading || !selectedDepartment || !newPassword || !confirmPassword || !adminPassword}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading-spinner">⏳</span>
                                    변경 중...
                                </>
                            ) : (
                                '비밀번호 변경'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminModal;
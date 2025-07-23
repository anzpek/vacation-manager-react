// SettingsModal.jsx - 설정 모달 컴포넌트
import React, { useState } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { exportData, importData, clearAllData } from '../../utils/storage';
import './SettingsModal.css';

const SettingsModal = () => {
    const { state, actions } = useVacation();
    const { ui } = state;
    
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');

    const handleExport = () => {
        exportData(state.employees, state.vacations);
    };

    const handleImport = () => {
        try {
            const result = importData(importText);
            if (result.success) {
                if (result.employees) {
                    actions.updateEmployees(result.employees);
                }
                if (result.vacations) {
                    actions.updateVacations(result.vacations);
                }
                setImportText('');
                setImportError('');
                alert('데이터를 성공적으로 가져왔습니다!');
                actions.closeModal();
            } else {
                setImportError(result.error);
            }
        } catch (error) {
            setImportError('잘못된 데이터 형식입니다.');
        }
    };

    const handleClearData = () => {
        if (clearAllData()) {
            window.location.reload();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            actions.closeModal();
        }
    };

    if (!ui.isModalOpen || ui.modalType !== 'settings') {
        return null;
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal settings-modal">
                <div className="modal-header">
                    <h2 className="modal-title">설정</h2>
                    <button 
                        className="modal-close"
                        onClick={actions.closeModal}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h3>데이터 관리</h3>
                        
                        <div className="settings-item">
                            <h4>데이터 내보내기</h4>
                            <p>현재 데이터를 JSON 파일로 다운로드합니다.</p>
                            <button 
                                className="btn btn-primary"
                                onClick={handleExport}
                            >
                                데이터 내보내기
                            </button>
                        </div>

                        <div className="settings-item">
                            <h4>데이터 가져오기</h4>
                            <p>JSON 데이터를 붙여넣어 가져옵니다.</p>
                            <textarea
                                className="import-textarea"
                                placeholder="JSON 데이터를 여기에 붙여넣으세요..."
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                rows={6}
                            />
                            {importError && (
                                <div className="error-message">{importError}</div>
                            )}
                            <button 
                                className="btn btn-success"
                                onClick={handleImport}
                                disabled={!importText.trim()}
                            >
                                데이터 가져오기
                            </button>
                        </div>

                        <div className="settings-item danger-zone">
                            <h4>위험 구역</h4>
                            <p>모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p>
                            <button 
                                className="btn btn-danger"
                                onClick={handleClearData}
                            >
                                모든 데이터 삭제
                            </button>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>정보</h3>
                        
                        <div className="settings-item">
                            <h4>버전 정보</h4>
                            <p>휴가관리 시스템 v2.0.0</p>
                            <p>React 기반 웹 애플리케이션</p>
                        </div>

                        <div className="settings-item">
                            <h4>저장 정보</h4>
                            <p>직원 수: {state.employees.length}명</p>
                            <p>휴가 기록: {Object.keys(state.vacations).length}일</p>
                            <p>데이터 저장: 브라우저 로컬 스토리지</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={actions.closeModal}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;

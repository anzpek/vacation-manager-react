import React, { useState, useMemo } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { parseVacationText } from '../../utils/textParser';
import './TextInputModal.css';

function TextInputModal({ onClose }) {
  const { state, actions } = useVacation();
  const [text, setText] = useState('');

  const { parsedVacations, newEmployees, errors } = useMemo(() => {
    return parseVacationText(text, state.employees);
  }, [text, state.employees]);

  const vacationsWithConflicts = useMemo(() => {
    return parsedVacations.map(v => ({
      ...v,
      conflicts: actions.detectConflicts(v)
    }));
  }, [parsedVacations, actions]);

  const hasConflicts = vacationsWithConflicts.some(v => v.conflicts.length > 0);

  const handleSubmit = () => {
    actions.addBatchVacations(parsedVacations, newEmployees);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card-strong text-input-modal">
        <h2 className="heading-2 mb-6">일괄 텍스트 입력</h2>
        
        <div className="modal-content">
          <textarea
            className="text-area glass-card"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="김철수\n0315\n0316\n\n박영희\n0320(오전)"
          />
          
          <div className="preview-section">
            <h3 className="heading-3 mb-4">미리보기</h3>
            {errors.length > 0 && (
              <div className="error-list">
                {errors.map((err, i) => <div key={i}>{err}</div>)}
              </div>
            )}
            <div className="preview-list">
              {vacationsWithConflicts.map((v, i) => (
                <div key={i} className={`preview-item ${v.conflicts.length > 0 ? 'conflict' : ''}`}>
                  <span>{v.employeeName}</span>
                  <span>{v.date.toLocaleDateString()}</span>
                  <span>{v.type}</span>
                  {v.conflicts.length > 0 && <span className="conflict-badge">충돌</span>}
                </div>
              ))}
            </div>
            {newEmployees.length > 0 && (
              <div className="new-employee-list">
                <strong>신규 직원:</strong> {newEmployees.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="glass-button">취소</button>
          <button 
            onClick={handleSubmit} 
            className="glass-button bg-primary-gradient text-white"
            disabled={parsedVacations.length === 0 || errors.length > 0 || hasConflicts}
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextInputModal;

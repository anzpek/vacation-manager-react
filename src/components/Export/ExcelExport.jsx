// ExcelExport.jsx - Excel 내보내기 컴포넌트
import React, { useState } from 'react';
import { useVacation } from '../../contexts/VacationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { exportVacationsToExcel, createVacationTemplate, exportVacationBalanceToExcel } from '../../utils/excelExport';
import './ExcelExport.css';

const ExcelExport = () => {
  const { state } = useVacation();
  const { showSuccess, showError } = useNotification();
  const { employees, vacations, selectedYear, selectedMonth } = state;
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeCurrentMonth: true,
    includeAllYear: false,
    includeStats: true
  });

  const handleExportCurrentMonth = async () => {
    setIsExporting(true);
    try {
      const result = await exportVacationsToExcel(vacations, employees, {
        year: selectedYear,
        month: selectedMonth,
        filename: `휴가현황_${selectedYear}년_${selectedMonth + 1}월_${new Date().toISOString().split('T')[0]}.xlsx`,
        includeStats: exportOptions.includeStats
      });

      if (result.success) {
        showSuccess(
          'Excel 내보내기 완료',
          `${result.recordCount}건의 휴가 데이터가 Excel로 내보내졌습니다.`
        );
      } else {
        showError('내보내기 실패', result.message);
      }
    } catch (error) {
      showError('내보내기 오류', '예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportYear = async () => {
    setIsExporting(true);
    try {
      const result = await exportVacationsToExcel(vacations, employees, {
        year: selectedYear,
        month: null, // 전체 연도
        filename: `휴가현황_${selectedYear}년_전체_${new Date().toISOString().split('T')[0]}.xlsx`,
        includeStats: exportOptions.includeStats
      });

      if (result.success) {
        showSuccess(
          'Excel 내보내기 완료',
          `${result.recordCount}건의 휴가 데이터가 Excel로 내보내졌습니다.`
        );
      } else {
        showError('내보내기 실패', result.message);
      }
    } catch (error) {
      showError('내보내기 오류', '예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportBalance = async () => {
    setIsExporting(true);
    try {
      const result = await exportVacationBalanceToExcel(employees, vacations, selectedYear);

      if (result.success) {
        showSuccess(
          '휴가 잔여현황 내보내기 완료',
          `${employees.length}명의 휴가 잔여현황이 Excel로 내보내졌습니다.`
        );
      } else {
        showError('내보내기 실패', result.message);
      }
    } catch (error) {
      showError('내보내기 오류', '예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateTemplate = async () => {
    setIsExporting(true);
    try {
      const result = await createVacationTemplate();

      if (result.success) {
        showSuccess(
          '템플릿 생성 완료',
          '휴가 입력 템플릿이 다운로드되었습니다.'
        );
      } else {
        showError('템플릿 생성 실패', result.message);
      }
    } catch (error) {
      showError('템플릿 생성 오류', '예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentMonthVacations = vacations.filter(vacation => {
    const vacationDate = new Date(vacation.date);
    return vacationDate.getFullYear() === selectedYear && 
           vacationDate.getMonth() === selectedMonth;
  });

  const currentYearVacations = vacations.filter(vacation => {
    const vacationDate = new Date(vacation.date);
    return vacationDate.getFullYear() === selectedYear;
  });

  return (
    <div className="excel-export">
      <div className="export-header">
        <h3 className="export-title">
          📊 Excel 내보내기
        </h3>
        <p className="export-description">
          휴가 데이터를 Excel 파일로 내보내거나 템플릿을 다운로드할 수 있습니다.
        </p>
      </div>

      <div className="export-options">
        <div className="export-section">
          <h4 className="section-title">휴가 현황 내보내기</h4>
          
          <div className="export-buttons">
            <button
              className="export-button export-button--primary"
              onClick={handleExportCurrentMonth}
              disabled={isExporting || currentMonthVacations.length === 0}
            >
              <span className="button-icon">📅</span>
              <div className="button-content">
                <span className="button-title">현재 월 내보내기</span>
                <span className="button-subtitle">
                  {selectedYear}년 {selectedMonth + 1}월 ({currentMonthVacations.length}건)
                </span>
              </div>
            </button>

            <button
              className="export-button export-button--secondary"
              onClick={handleExportYear}
              disabled={isExporting || currentYearVacations.length === 0}
            >
              <span className="button-icon">📆</span>
              <div className="button-content">
                <span className="button-title">연간 전체 내보내기</span>
                <span className="button-subtitle">
                  {selectedYear}년 전체 ({currentYearVacations.length}건)
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="export-section">
          <h4 className="section-title">휴가 잔여현황</h4>
          
          <div className="export-buttons">
            <button
              className="export-button export-button--balance"
              onClick={handleExportBalance}
              disabled={isExporting || employees.length === 0}
            >
              <span className="button-icon">💼</span>
              <div className="button-content">
                <span className="button-title">잔여일수 현황</span>
                <span className="button-subtitle">
                  {selectedYear}년 연차 잔여현황 ({employees.length}명)
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="export-section">
          <h4 className="section-title">템플릿 다운로드</h4>
          
          <div className="export-buttons">
            <button
              className="export-button export-button--template"
              onClick={handleCreateTemplate}
              disabled={isExporting}
            >
              <span className="button-icon">📋</span>
              <div className="button-content">
                <span className="button-title">휴가 입력 템플릿</span>
                <span className="button-subtitle">
                  대량 휴가 등록용 Excel 템플릿
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="export-info">
        <div className="info-card">
          <h5 className="info-title">📋 내보내기 정보</h5>
          <ul className="info-list">
            <li>• Excel 파일에는 휴가목록, 직원별통계, 요약 시트가 포함됩니다</li>
            <li>• 연간 내보내기 시 월별통계 시트가 추가됩니다</li>
            <li>• 휴가 잔여현황은 연차 사용률과 잔여일수를 포함합니다</li>
            <li>• 템플릿을 사용하여 대량의 휴가 데이터를 입력할 수 있습니다</li>
          </ul>
        </div>

        {isExporting && (
          <div className="export-loading">
            <div className="loading-spinner"></div>
            <span className="loading-text">Excel 파일을 생성하는 중...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelExport;
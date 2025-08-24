// excelExport.js - Excel 내보내기 유틸리티
import * as XLSX from 'xlsx';

// 휴가 데이터를 Excel로 내보내기
export const exportVacationsToExcel = (vacations, employees, options = {}) => {
  const {
    filename = `휴가현황_${new Date().toISOString().split('T')[0]}.xlsx`,
    year = new Date().getFullYear(),
    month = null,
    includeStats = true
  } = options;

  try {
    // 직원 정보 매핑
    const employeeMap = employees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {});

    // 휴가 데이터 필터링 (연도/월 기준)
    const filteredVacations = vacations.filter(vacation => {
      const vacationDate = new Date(vacation.date);
      const matchYear = vacationDate.getFullYear() === year;
      const matchMonth = month === null || vacationDate.getMonth() === month;
      return matchYear && matchMonth;
    });

    // 휴가 목록 시트 데이터 준비
    const vacationListData = filteredVacations.map(vacation => {
      const employee = employeeMap[vacation.employeeId];
      const vacationDate = new Date(vacation.date);
      
      return {
        '날짜': vacationDate.toLocaleDateString('ko-KR'),
        '요일': ['일', '월', '화', '수', '목', '금', '토'][vacationDate.getDay()],
        '직원명': employee?.name || '알 수 없음',
        '팀': employee?.team || '알 수 없음',
        '직급': employee?.position || '알 수 없음',
        '휴가유형': vacation.type,
        '비고': vacation.note || ''
      };
    });

    // 직원별 통계 시트 데이터 준비
    const employeeStatsData = employees.map(employee => {
      const employeeVacations = filteredVacations.filter(v => v.employeeId === employee.id);
      
      const stats = {
        연차: 0,
        반차: 0,
        특별휴가: 0,
        병가: 0,
        업무: 0
      };

      employeeVacations.forEach(vacation => {
        switch (vacation.type) {
          case '연차':
            stats.연차 += 1;
            break;
          case '오전':
          case '오후':
            stats.반차 += 0.5;
            break;
          case '특별휴가':
            stats.특별휴가 += 1;
            break;
          case '병가':
            stats.병가 += 1;
            break;
          case '업무':
            stats.업무 += 1;
            break;
        }
      });

      return {
        '직원명': employee.name,
        '팀': employee.team,
        '직급': employee.position,
        '연차': stats.연차,
        '반차': stats.반차,
        '특별휴가': stats.특별휴가,
        '병가': stats.병가,
        '업무': stats.업무,
        '총 휴가일': stats.연차 + stats.반차 + stats.특별휴가 + stats.병가 + stats.업무
      };
    });

    // 월별 통계 시트 데이터 준비 (연도별 전체 보기인 경우)
    let monthlyStatsData = [];
    if (month === null) {
      const monthlyStats = {};
      
      for (let m = 0; m < 12; m++) {
        const monthVacations = vacations.filter(vacation => {
          const vacationDate = new Date(vacation.date);
          return vacationDate.getFullYear() === year && vacationDate.getMonth() === m;
        });
        
        monthlyStats[m] = {
          '월': `${m + 1}월`,
          '총 휴가': monthVacations.length,
          '연차': monthVacations.filter(v => v.type === '연차').length,
          '반차': monthVacations.filter(v => v.type === '오전' || v.type === '오후').length,
          '특별휴가': monthVacations.filter(v => v.type === '특별휴가').length,
          '병가': monthVacations.filter(v => v.type === '병가').length,
          '업무': monthVacations.filter(v => v.type === '업무').length
        };
      }
      
      monthlyStatsData = Object.values(monthlyStats);
    }

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 휴가 목록 시트
    const vacationListSheet = XLSX.utils.json_to_sheet(vacationListData);
    XLSX.utils.book_append_sheet(workbook, vacationListSheet, '휴가목록');

    // 직원별 통계 시트
    const employeeStatsSheet = XLSX.utils.json_to_sheet(employeeStatsData);
    XLSX.utils.book_append_sheet(workbook, employeeStatsSheet, '직원별통계');

    // 월별 통계 시트 (연도별 보기인 경우에만)
    if (monthlyStatsData.length > 0) {
      const monthlyStatsSheet = XLSX.utils.json_to_sheet(monthlyStatsData);
      XLSX.utils.book_append_sheet(workbook, monthlyStatsSheet, '월별통계');
    }

    // 요약 정보 시트
    const summaryData = [
      { '항목': '내보내기 일시', '값': new Date().toLocaleString('ko-KR') },
      { '항목': '대상 기간', '값': month === null ? `${year}년` : `${year}년 ${month + 1}월` },
      { '항목': '총 휴가 수', '값': filteredVacations.length },
      { '항목': '총 직원 수', '값': employees.length },
      { '항목': '평균 휴가', '값': employees.length > 0 ? (filteredVacations.length / employees.length).toFixed(1) : '0' }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');

    // 파일 다운로드
    XLSX.writeFile(workbook, filename);
    
    return {
      success: true,
      message: `Excel 파일이 다운로드되었습니다: ${filename}`,
      filename,
      recordCount: filteredVacations.length
    };

  } catch (error) {
    console.error('Excel 내보내기 실패:', error);
    return {
      success: false,
      message: `Excel 내보내기 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  }
};

// 휴가 템플릿 Excel 파일 생성
export const createVacationTemplate = () => {
  try {
    const templateData = [
      {
        '날짜': '2024-01-15',
        '직원명': '홍길동',
        '팀': '개발팀',
        '휴가유형': '연차',
        '비고': '개인사정'
      },
      {
        '날짜': '2024-01-16',
        '직원명': '김영희',
        '팀': '디자인팀',
        '휴가유형': '오전',
        '비고': '병원 진료'
      }
    ];

    const instructions = [
      { '항목': '날짜 형식', '설명': 'YYYY-MM-DD (예: 2024-01-15)' },
      { '항목': '휴가유형', '설명': '연차, 오전, 오후, 특별휴가, 병가, 업무 중 선택' },
      { '항목': '직원명', '설명': '정확한 직원명 입력 필요' },
      { '항목': '팀', '설명': '해당 직원의 소속 팀명' },
      { '항목': '비고', '설명': '선택사항, 휴가 사유 등' }
    ];

    const workbook = XLSX.utils.book_new();
    
    // 템플릿 시트
    const templateSheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, templateSheet, '휴가입력템플릿');
    
    // 사용법 시트
    const instructionSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, '사용법');

    const filename = `휴가입력템플릿_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      message: `템플릿 파일이 다운로드되었습니다: ${filename}`,
      filename
    };

  } catch (error) {
    console.error('템플릿 생성 실패:', error);
    return {
      success: false,
      message: `템플릿 생성 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  }
};

// 휴가 잔여일수 Excel 내보내기
export const exportVacationBalanceToExcel = (employees, vacations, year = new Date().getFullYear()) => {
  try {
    // 직원별 휴가 잔여일수 계산
    const balanceData = employees.map(employee => {
      const baseAnnualLeave = 15; // 기본 연차
      const yearlyVacations = vacations.filter(vacation => {
        const vacationDate = new Date(vacation.date);
        return vacationDate.getFullYear() === year && vacation.employeeId === employee.id;
      });

      let usedDays = {
        annual: 0,
        halfDay: 0,
        special: 0,
        sick: 0
      };

      yearlyVacations.forEach(vacation => {
        switch (vacation.type) {
          case '연차':
            usedDays.annual += 1;
            break;
          case '오전':
          case '오후':
            usedDays.halfDay += 0.5;
            break;
          case '특별휴가':
            usedDays.special += 1;
            break;
          case '병가':
            usedDays.sick += 1;
            break;
        }
      });

      const remainingAnnualLeave = baseAnnualLeave - usedDays.annual - usedDays.halfDay;
      const usageRate = baseAnnualLeave > 0 ? ((usedDays.annual + usedDays.halfDay) / baseAnnualLeave * 100) : 0;

      return {
        '직원명': employee.name,
        '팀': employee.team,
        '직급': employee.position,
        '기본연차': baseAnnualLeave,
        '사용연차': usedDays.annual,
        '사용반차': usedDays.halfDay,
        '잔여연차': remainingAnnualLeave,
        '사용률(%)': Math.round(usageRate * 10) / 10,
        '특별휴가': usedDays.special,
        '병가': usedDays.sick,
        '총사용일': usedDays.annual + usedDays.halfDay + usedDays.special
      };
    });

    const workbook = XLSX.utils.book_new();
    const balanceSheet = XLSX.utils.json_to_sheet(balanceData);
    XLSX.utils.book_append_sheet(workbook, balanceSheet, '휴가잔여현황');

    const filename = `휴가잔여현황_${year}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      message: `휴가 잔여현황이 Excel로 내보내졌습니다: ${filename}`,
      filename
    };

  } catch (error) {
    console.error('휴가 잔여현황 내보내기 실패:', error);
    return {
      success: false,
      message: `내보내기 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  }
};
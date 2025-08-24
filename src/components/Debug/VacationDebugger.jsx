import React, { useState } from 'react';
import { useVacation } from '../../contexts/VacationContext';

const VacationDebugger = () => {
  // 디버거 숨김 처리
  return null;
  const { state, actions } = useVacation();
  const [selectedDate, setSelectedDate] = useState('2025-07-22');
  const [debugInfo, setDebugInfo] = useState(null);

  const analyzeVacations = () => {
    const { vacations, employees } = state;
    
    console.log('[VacationDebugger] 전체 직원 목록:', employees.map(emp => ({ id: emp.id, name: emp.name, idType: typeof emp.id })));
    console.log('[VacationDebugger] 전체 휴가 목록:', vacations.map(v => ({ id: v.id, employeeId: v.employeeId, idType: typeof v.employeeId, date: v.date })));
    
    // 선택된 날짜의 휴가 분석
    const dateVacations = vacations.filter(v => v.date === selectedDate);
    
    // 임국단 관련 모든 데이터 분석
    const imgukdanVacations = vacations.filter(v => {
      const emp = employees.find(e => e.id === v.employeeId);
      return emp?.name === '임국단';
    });
    
    // 임국단 이름으로 찾은 직원 정보
    const imgukdanByName = employees.filter(emp => emp.name === '임국단');
    console.log('[VacationDebugger] 임국단 직원들:', imgukdanByName);
    
    // 특정 employeeId로 찾은 휴가들
    const vacationsWithEmployeeId1752796963588 = vacations.filter(v => v.employeeId === 1752796963588);
    
    // 모든 고아 휴가 찾기 (전체 날짜 범위)
    const validEmployeeIds = employees.map(emp => emp.id);
    const allOrphanedVacations = vacations.filter(v => !validEmployeeIds.includes(v.employeeId));
    console.log('[VacationDebugger] 전체 고아 휴가:', allOrphanedVacations);
    
    // 중복 휴가 찾기
    const duplicates = [];
    const seen = new Map();
    
    dateVacations.forEach(vacation => {
      const key = `${vacation.employeeId}-${vacation.date}-${vacation.type}`;
      if (seen.has(key)) {
        duplicates.push({
          original: seen.get(key),
          duplicate: vacation
        });
      } else {
        seen.set(key, vacation);
      }
    });
    
    // 직원 정보 매핑 및 ID 타입 분석
    const vacationsWithEmployeeInfo = dateVacations.map(v => {
      const employee = employees.find(emp => emp.id === v.employeeId);
      
      return {
        ...v,
        employeeName: employee?.name || '알 수 없음',
        employeeFound: !!employee,
        employeeIdType: typeof v.employeeId,
        matchedEmployeeId: employee?.id,
        matchedEmployeeIdType: typeof employee?.id
      };
    });
    
    // ID 타입 불일치 찾기
    const idTypeMismatches = vacationsWithEmployeeInfo.filter(v => !v.employeeFound);
    
    setDebugInfo({
      selectedDate,
      totalVacations: dateVacations.length,
      uniqueVacations: seen.size,
      duplicates,
      vacationsWithEmployeeInfo,
      idTypeMismatches,
      allEmployees: employees.map(emp => ({ id: emp.id, name: emp.name, idType: typeof emp.id })),
      // 임국단 관련 추가 정보
      imgukdanVacations,
      imgukdanByName,
      vacationsWithEmployeeId1752796963588,
      allOrphanedVacations
    });
  };

  const removeDuplicates = () => {
    if (!debugInfo || debugInfo.duplicates.length === 0) {
      alert('제거할 중복 휴가가 없습니다.');
      return;
    }

    const duplicateIds = debugInfo.duplicates.map(d => d.duplicate.id);
    
    if (window.confirm(`${duplicateIds.length}개의 중복 휴가를 제거하시겠습니까?`)) {
      // 중복 휴가들을 하나씩 제거
      duplicateIds.forEach(id => {
        actions.deleteVacation(id);
      });
      
      alert(`${duplicateIds.length}개의 중복 휴가가 제거되었습니다.`);
      
      // 분석 다시 실행
      setTimeout(() => {
        analyzeVacations();
      }, 100);
    }
  };

  const addTestVacation = () => {
    // 테스트용 휴가 추가
    const testEmployeeId = state.employees[0]?.id;
    if (!testEmployeeId) {
      alert('직원이 없습니다.');
      return;
    }

    actions.addVacation({
      employeeId: testEmployeeId,
      date: selectedDate,
      type: '연차',
      description: '테스트 휴가'
    });

    setTimeout(() => {
      analyzeVacations();
    }, 100);
  };

  const fixIdTypeMismatches = () => {
    if (!debugInfo || debugInfo.idTypeMismatches.length === 0) {
      alert('수정할 ID 타입 불일치가 없습니다.');
      return;
    }

    // localStorage에서 직접 수정
    const vacationKey = `vacation_${state.department}_vacations`;
    const vacationData = JSON.parse(localStorage.getItem(vacationKey) || '[]');
    
    let fixedCount = 0;
    const fixedData = vacationData.map(v => {
      // employeeId가 문자열이면 숫자로 변환
      if (typeof v.employeeId === 'string') {
        const numericId = parseInt(v.employeeId, 10);
        if (!isNaN(numericId)) {
          fixedCount++;
          return { ...v, employeeId: numericId };
        }
      }
      return v;
    });

    if (fixedCount > 0) {
      localStorage.setItem(vacationKey, JSON.stringify(fixedData));
      alert(`${fixedCount}개의 ID 타입 불일치를 수정했습니다. 페이지를 새로고침하세요.`);
    } else {
      alert('수정할 ID 타입 불일치가 없습니다.');
    }
  };

  const fixOrphanedVacations = () => {
    if (!debugInfo || debugInfo.idTypeMismatches.length === 0) {
      alert('수정할 고아 휴가가 없습니다.');
      return;
    }

    // 임국단 직원 찾기
    const imgukdanEmployee = state.employees.find(emp => emp.name === '임국단');
    if (!imgukdanEmployee) {
      alert('임국단 직원을 찾을 수 없습니다.');
      return;
    }

    // localStorage에서 직접 수정
    const vacationKey = `vacation_${state.department}_vacations`;
    const vacationData = JSON.parse(localStorage.getItem(vacationKey) || '[]');
    
    let fixedCount = 0;
    const fixedData = vacationData.map(v => {
      // 존재하지 않는 employeeId를 가진 휴가를 임국단 ID로 수정
      const employeeExists = state.employees.find(emp => emp.id === v.employeeId);
      if (!employeeExists && v.date === selectedDate) {
        fixedCount++;
        return { ...v, employeeId: imgukdanEmployee.id };
      }
      return v;
    });

    if (fixedCount > 0) {
      localStorage.setItem(vacationKey, JSON.stringify(fixedData));
      alert(`${fixedCount}개의 고아 휴가를 임국단님으로 연결했습니다. 페이지를 새로고침하세요.`);
    } else {
      alert('수정할 고아 휴가가 없습니다.');
    }
  };

  const deleteSpecificVacation = (vacationId) => {
    if (!window.confirm(`휴가 ID ${vacationId}를 삭제하시겠습니까?`)) {
      return;
    }

    console.log(`[VacationDebugger] 휴가 삭제 시도: ID ${vacationId}`);
    
    // 1. Context actions를 통한 삭제 시도
    try {
      actions.deleteVacation(vacationId);
      console.log(`[VacationDebugger] Context를 통한 삭제 완료: ID ${vacationId}`);
    } catch (error) {
      console.log(`[VacationDebugger] Context 삭제 실패:`, error);
    }
    
    // 2. localStorage에서 직접 삭제 (백업 방법)
    const vacationKey = `vacation_${state.department}_vacations`;
    const vacationData = JSON.parse(localStorage.getItem(vacationKey) || '[]');
    console.log(`[VacationDebugger] 삭제 전 localStorage 휴가 수:`, vacationData.length);
    
    const beforeCount = vacationData.length;
    const filteredData = vacationData.filter(v => {
      // ID 타입 불일치를 고려한 비교
      const vId = typeof v.id === 'string' ? parseInt(v.id, 10) : v.id;
      const targetId = typeof vacationId === 'string' ? parseInt(vacationId, 10) : vacationId;
      return vId !== targetId;
    });
    const afterCount = filteredData.length;
    
    console.log(`[VacationDebugger] 삭제 후 localStorage 휴가 수:`, afterCount);
    console.log(`[VacationDebugger] 실제 삭제된 휴가 수:`, beforeCount - afterCount);
    
    if (beforeCount !== afterCount) {
      localStorage.setItem(vacationKey, JSON.stringify(filteredData));
      
      // Context state도 강제로 업데이트
      actions.setVacations(filteredData);
      
      alert(`휴가 ID ${vacationId}가 삭제되었습니다.`);
      
      // 분석 다시 실행
      setTimeout(() => {
        analyzeVacations();
      }, 100);
    } else {
      alert(`휴가 ID ${vacationId} 삭제 실패: 해당 휴가를 찾을 수 없습니다.`);
    }
  };

  const fixEmployeeIdMismatch = () => {
    // 임국단 직원 중 실제로 존재하는 직원 찾기
    const imgukdanEmployee = state.employees.find(emp => emp.name === '임국단');
    
    if (!imgukdanEmployee) {
      alert('임국단 직원을 찾을 수 없습니다.');
      return;
    }

    // employeeId 1752796963588을 가진 모든 휴가를 올바른 임국단 ID로 수정
    const vacationKey = `vacation_${state.department}_vacations`;
    const vacationData = JSON.parse(localStorage.getItem(vacationKey) || '[]');
    
    let fixedCount = 0;
    const fixedData = vacationData.map(v => {
      if (v.employeeId === 1752796963588) {
        fixedCount++;
        return { ...v, employeeId: imgukdanEmployee.id };
      }
      return v;
    });

    if (fixedCount > 0) {
      localStorage.setItem(vacationKey, JSON.stringify(fixedData));
      alert(`${fixedCount}개의 휴가 employeeId를 수정했습니다. 페이지를 새로고침하세요.`);
    } else {
      alert('수정할 휴가가 없습니다.');
    }
  };

  const performDataIntegrityCheck = () => {
    const result = actions.performDataIntegrityCheck();
    console.log('데이터 무결성 체크 결과:', result);
    
    let message = '데이터 무결성 체크 완료!\n\n';
    if (result.hasIssues) {
      message += '발견된 문제:\n';
      result.issues.forEach(issue => {
        message += `- ${issue}\n`;
      });
    } else {
      message += '모든 데이터가 정상입니다.';
    }
    
    alert(message);
    return result;
  };

  const performCompleteCleanup = () => {
    if (!window.confirm('전체 데이터 정리를 수행하시겠습니까?\n\n다음 작업이 수행됩니다:\n- 고아 휴가 제거\n- 중복 휴가 제거\n- ID 타입 정리\n\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const result = actions.performCompleteDataCleanup();
    
    let message = '데이터 정리 완료!\n\n';
    message += `- 고아 휴가 제거: ${result.orphanedRemoved}개\n`;
    message += `- 중복 휴가 제거: ${result.duplicatesRemoved}개\n`;
    message += `- ID 타입 수정: ${result.idTypesFixed}개\n`;
    
    if (result.orphanedRemoved + result.duplicatesRemoved + result.idTypesFixed > 0) {
      message += '\n페이지를 새로고침하여 변경사항을 확인하세요.';
    }
    
    alert(message);
    
    // 분석 다시 실행
    setTimeout(() => {
      analyzeVacations();
    }, 100);
  };

  const deleteAllOrphanedVacations = () => {
    if (!debugInfo || !debugInfo.allOrphanedVacations || debugInfo.allOrphanedVacations.length === 0) {
      alert('제거할 고아 휴가가 없습니다.');
      return;
    }

    const orphanedCount = debugInfo.allOrphanedVacations.length;
    if (!window.confirm(`${orphanedCount}개의 고아 휴가를 모두 삭제하시겠습니까?\n\n고아 휴가: 존재하지 않는 직원의 휴가\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    // localStorage에서 직접 제거
    const vacationKey = `vacation_${state.department}_vacations`;
    const vacationData = JSON.parse(localStorage.getItem(vacationKey) || '[]');
    const validEmployeeIds = state.employees.map(emp => emp.id);
    
    const cleanedData = vacationData.filter(v => validEmployeeIds.includes(v.employeeId));
    const removedCount = vacationData.length - cleanedData.length;
    
    localStorage.setItem(vacationKey, JSON.stringify(cleanedData));
    
    alert(`${removedCount}개의 고아 휴가가 삭제되었습니다.\n페이지를 새로고침하여 확인하세요.`);
    
    // 분석 다시 실행
    setTimeout(() => {
      analyzeVacations();
    }, 100);
  };

  const forceReloadData = () => {
    if (window.confirm('데이터를 강제로 다시 로드하시겠습니까?\n\n이렇게 하면 메모리의 데이터가 localStorage의 최신 데이터로 동기화됩니다.')) {
      window.location.reload();
    }
  };

  const debugEmployeeVacationMatching = () => {
    console.log('=== 직원-휴가 매칭 상세 디버깅 ===');
    
    const { vacations, employees } = state;
    const validEmployeeIds = employees.map(emp => emp.id);
    
    console.log('1. 전체 직원 목록:');
    employees.forEach(emp => {
      console.log(`   - ID: ${emp.id} (${typeof emp.id}) | 이름: ${emp.name}`);
    });
    
    console.log('\n2. 전체 휴가 목록:');
    vacations.forEach(v => {
      const employee = employees.find(emp => emp.id === v.employeeId);
      const isOrphan = !validEmployeeIds.includes(v.employeeId);
      console.log(`   - 휴가ID: ${v.id} | 직원ID: ${v.employeeId} (${typeof v.employeeId}) | 날짜: ${v.date} | 타입: ${v.type} | 직원명: ${employee?.name || '없음'} | 고아: ${isOrphan}`);
    });
    
    console.log('\n3. localStorage 직접 확인:');
    const empKey = `vacation_${state.department}_employees`;
    const vacKey = `vacation_${state.department}_vacations`;
    const lsEmployees = JSON.parse(localStorage.getItem(empKey) || '[]');
    const lsVacations = JSON.parse(localStorage.getItem(vacKey) || '[]');
    
    console.log('localStorage 직원:', lsEmployees.map(emp => ({ id: emp.id, name: emp.name, idType: typeof emp.id })));
    console.log('localStorage 휴가:', lsVacations.map(v => ({ id: v.id, employeeId: v.employeeId, idType: typeof v.employeeId, date: v.date })));
    
    console.log('\n4. 연속휴가 분석:');
    const imgukdanEmployee = employees.find(emp => emp.name === '임국단');
    if (imgukdanEmployee) {
      const imgukdanVacations = vacations
        .filter(v => v.employeeId === imgukdanEmployee.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      console.log('임국단 휴가 목록 (날짜순):');
      imgukdanVacations.forEach(v => {
        console.log(`   - ${v.date} ${v.type} (ID: ${v.id})`);
      });
      
      // 상세한 연속휴가 계산 시뮬레이션
      console.log('\n🔍 연속휴가 계산 시뮬레이션 (Calendar.jsx 로직 재현):');
      let currentGroup = null;
      
      imgukdanVacations.forEach((vacation, index) => {
        const currentDate = new Date(vacation.date);
        console.log(`\n--- 처리 중: ${vacation.date} ${vacation.type} ---`);
        
        if (!currentGroup) {
          currentGroup = {
            employeeId: imgukdanEmployee.id,
            employeeName: imgukdanEmployee.name,
            startDate: vacation.date,
            endDate: vacation.date,
            type: vacation.type,
            vacations: [vacation],
            isConsecutive: false
          };
          console.log(`   새 그룹 시작: ${currentGroup.startDate}`);
        } else {
          const lastDate = new Date(currentGroup.endDate);
          const nextDay = new Date(lastDate);
          nextDay.setDate(nextDay.getDate() + 1);
          
          console.log(`   연속성 체크: 마지막날 ${currentGroup.endDate} + 1일 = ${nextDay.toISOString().split('T')[0]}, 현재날 ${vacation.date}`);
          
          if (currentDate.getTime() === nextDay.getTime()) {
            currentGroup.endDate = vacation.date;
            currentGroup.vacations.push(vacation);
            currentGroup.isConsecutive = true;
            console.log(`   ✅ 연속됨! 그룹 확장: ${currentGroup.startDate} ~ ${currentGroup.endDate} (${currentGroup.vacations.length}일)`);
          } else {
            // 연속이 끊기면 현재 그룹을 저장하고 새 그룹 시작
            if (currentGroup.vacations.length > 1) {
              console.log(`   📋 연속휴가 그룹 완성: ${currentGroup.startDate} ~ ${currentGroup.endDate} (${currentGroup.vacations.length}일)`);
              currentGroup.vacations.forEach(v => {
                console.log(`     - ${v.date} ${v.type}`);
              });
            } else {
              console.log(`   📋 단일휴가: ${currentGroup.startDate} ${currentGroup.vacations[0].type}`);
            }
            
            currentGroup = {
              employeeId: imgukdanEmployee.id,
              employeeName: imgukdanEmployee.name,
              startDate: vacation.date,
              endDate: vacation.date,
              type: vacation.type,
              vacations: [vacation],
              isConsecutive: false
            };
            console.log(`   새 그룹 시작: ${currentGroup.startDate}`);
          }
        }
        
        // 마지막 휴가 처리
        if (index === imgukdanVacations.length - 1) {
          if (currentGroup.vacations.length > 1) {
            console.log(`   📋 최종 연속휴가 그룹: ${currentGroup.startDate} ~ ${currentGroup.endDate} (${currentGroup.vacations.length}일)`);
            currentGroup.vacations.forEach(v => {
              console.log(`     - ${v.date} ${v.type}`);
            });
          } else {
            console.log(`   📋 최종 단일휴가: ${currentGroup.startDate} ${currentGroup.vacations[0].type}`);
          }
        }
      });
    }
    
    alert('연속휴가 계산 시뮬레이션이 콘솔에 출력되었습니다. F12를 눌러 콘솔을 확인하세요.');
  };

  const debugVacationDisappearing = () => {
    console.log('=== 휴가 사라짐 디버깅 ===');
    
    const { vacations, employees } = state;
    const imgukdanEmployee = employees.find(emp => emp.name === '임국단');
    
    if (!imgukdanEmployee) {
      alert('임국단 직원을 찾을 수 없습니다.');
      return;
    }
    
    console.log('임국단 ID:', imgukdanEmployee.id);
    
    // 현재 임국단 휴가들
    const imgukdanVacations = vacations
      .filter(v => v.employeeId === imgukdanEmployee.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('\n현재 임국단 휴가들:');
    imgukdanVacations.forEach(v => {
      console.log(`   ${v.date} ${v.type} (ID: ${v.id})`);
    });
    
    // 특정 날짜들에서 휴가 처리 시뮬레이션
    const testDates = ['2025-07-21', '2025-07-22', '2025-07-23'];
    
    testDates.forEach(testDate => {
      console.log(`\n📅 ${testDate} 분석:`);
      
      // 해당 날짜의 휴가들
      const dateVacations = imgukdanVacations.filter(v => v.date === testDate);
      console.log(`   이 날짜의 휴가들: ${dateVacations.map(v => v.type).join(', ')}`);
      
      // fullDay vs halfDay 분류
      const fullDayVacations = dateVacations.filter(v => !['오전', '오후'].includes(v.type));
      const halfDayVacations = dateVacations.filter(v => ['오전', '오후'].includes(v.type));
      
      console.log(`   - fullDay: ${fullDayVacations.length}개 (${fullDayVacations.map(v => v.type).join(', ')})`);
      console.log(`   - halfDay: ${halfDayVacations.length}개 (${halfDayVacations.map(v => v.type).join(', ')})`);
      
      // 연속휴가 그룹 확인 (실제 Context 함수 호출)
      halfDayVacations.forEach(halfVacation => {
        // Calendar의 getConsecutiveGroupForDate와 동일한 로직 시뮬레이션
        console.log(`   ${halfVacation.type} 반차의 연속휴가 그룹 체크...`);
        
        // 여기서 실제로 getConsecutiveVacations를 호출해서 결과 확인
        // (이 부분은 Calendar.jsx의 로직을 직접 확인해야 함)
      });
    });
    
    alert('휴가 사라짐 디버깅 정보가 콘솔에 출력되었습니다.');
  };

  const forceRefreshConsecutiveVacations = () => {
    console.log('=== 연속휴가 강제 재계산 ===');
    
    if (window.confirm('현재 화면을 새로고침하여 연속휴가를 재계산하시겠습니까?\n\n데이터는 안전하게 보존됩니다.')) {
      // 안전한 페이지 새로고침만 수행
      window.location.reload();
    }
  };

  const debugConsecutiveSeparation = () => {
    console.log('=== 연속휴가 분리 디버깅 ===');
    
    const { vacations, employees } = state;
    const imgukdanEmployee = employees.find(emp => emp.name === '임국단');
    
    if (!imgukdanEmployee) {
      alert('임국단 직원을 찾을 수 없습니다.');
      return;
    }
    
    // 현재 임국단의 휴가들
    const imgukdanVacations = vacations
      .filter(v => v.employeeId === imgukdanEmployee.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('현재 임국단 휴가들:');
    imgukdanVacations.forEach(v => {
      console.log(`   ${v.date} ${v.type} (ID: ${v.id})`);
    });
    
    // 전체 휴가 데이터도 확인
    console.log('\n전체 휴가 데이터 (20-23일):');
    const targetDates = ['2025-07-20', '2025-07-21', '2025-07-22', '2025-07-23'];
    targetDates.forEach(date => {
      const dateVacations = vacations.filter(v => v.date === date);
      console.log(`   ${date}: ${dateVacations.length}개`);
      dateVacations.forEach(v => {
        const emp = employees.find(e => e.id === v.employeeId);
        console.log(`     - ${emp?.name || '알수없음'} ${v.type} (ID: ${v.id})`);
      });
    });
    
    // 연속휴가 시뮬레이션 (Calendar.jsx 로직과 동일)
    console.log('\n🔍 연속휴가 계산 결과:');
    let currentGroup = null;
    const consecutiveGroups = [];
    
    imgukdanVacations.forEach((vacation, index) => {
      const currentDate = new Date(vacation.date);
      
      if (!currentGroup) {
        currentGroup = {
          employeeId: imgukdanEmployee.id,
          employeeName: imgukdanEmployee.name,
          startDate: vacation.date,
          endDate: vacation.date,
          type: vacation.type,
          vacations: [vacation],
          isConsecutive: false
        };
        console.log(`   새 그룹 시작: ${currentGroup.startDate}`);
      } else {
        const lastDate = new Date(currentGroup.endDate);
        const nextDay = new Date(lastDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        console.log(`   연속성 체크: ${currentGroup.endDate} + 1일 = ${nextDay.toISOString().split('T')[0]} vs ${vacation.date}`);
        
        if (currentDate.getTime() === nextDay.getTime()) {
          currentGroup.endDate = vacation.date;
          currentGroup.vacations.push(vacation);
          currentGroup.isConsecutive = true;
          console.log(`   ✅ 연속! 그룹 확장: ${currentGroup.startDate} ~ ${currentGroup.endDate}`);
        } else {
          // 연속이 끊어짐
          if (currentGroup.vacations.length > 1) {
            console.log(`   📋 연속휴가 그룹 저장: ${currentGroup.startDate} ~ ${currentGroup.endDate} (${currentGroup.vacations.length}일)`);
            consecutiveGroups.push({ ...currentGroup });
          } else {
            console.log(`   📋 단일휴가 저장: ${currentGroup.startDate}`);
          }
          
          currentGroup = {
            employeeId: imgukdanEmployee.id,
            employeeName: imgukdanEmployee.name,
            startDate: vacation.date,
            endDate: vacation.date,
            type: vacation.type,
            vacations: [vacation],
            isConsecutive: false
          };
          console.log(`   새 그룹 시작: ${currentGroup.startDate}`);
        }
      }
      
      // 마지막 휴가 처리
      if (index === imgukdanVacations.length - 1) {
        if (currentGroup.vacations.length > 1) {
          console.log(`   📋 최종 연속휴가 그룹: ${currentGroup.startDate} ~ ${currentGroup.endDate} (${currentGroup.vacations.length}일)`);
          consecutiveGroups.push({ ...currentGroup });
        } else {
          console.log(`   📋 최종 단일휴가: ${currentGroup.startDate}`);
        }
      }
    });
    
    console.log('\n📊 최종 연속휴가 그룹들:');
    consecutiveGroups.forEach((group, index) => {
      console.log(`   그룹 ${index + 1}: ${group.startDate} ~ ${group.endDate} (${group.vacations.length}일)`);
      group.vacations.forEach(v => {
        console.log(`     - ${v.date} ${v.type}`);
      });
    });
    
    alert('연속휴가 분리 디버깅이 콘솔에 출력되었습니다. F12를 눌러 확인하세요.');
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '20px', 
      right: '20px', 
      width: '400px', 
      background: 'white', 
      border: '2px solid #ccc', 
      borderRadius: '8px', 
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <h3>휴가 디버거</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          분석할 날짜: 
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ marginLeft: '8px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={analyzeVacations} style={{ marginRight: '8px' }}>
          분석하기
        </button>
        <button onClick={addTestVacation} style={{ marginRight: '8px' }}>
          테스트 휴가 추가
        </button>
        <button onClick={fixEmployeeIdMismatch} style={{ marginRight: '8px', backgroundColor: '#007bff', color: 'white' }}>
          임국단 ID 수정
        </button>
        <button onClick={debugEmployeeVacationMatching} style={{ marginRight: '8px', backgroundColor: '#6f42c1', color: 'white' }}>
          🔬 상세 디버깅
        </button>
        <button onClick={debugVacationDisappearing} style={{ marginRight: '8px', backgroundColor: '#e83e8c', color: 'white' }}>
          🚨 사라짐 디버깅
        </button>
        <button onClick={forceRefreshConsecutiveVacations} style={{ marginRight: '8px', backgroundColor: '#20c997', color: 'white' }}>
          🔄 연속휴가 재계산
        </button>
        <button onClick={debugConsecutiveSeparation} style={{ marginRight: '8px', backgroundColor: '#fd7e14', color: 'white' }}>
          🔗 연속휴가 분리 테스트
        </button>
        {debugInfo && debugInfo.duplicates.length > 0 && (
          <button onClick={removeDuplicates} style={{ backgroundColor: '#ff6b6b', color: 'white', marginRight: '8px' }}>
            중복 제거
          </button>
        )}
        {debugInfo && debugInfo.idTypeMismatches.length > 0 && (
          <>
            <button onClick={fixIdTypeMismatches} style={{ backgroundColor: '#ffc107', color: 'black', marginRight: '8px' }}>
              ID 타입 수정
            </button>
            <button onClick={fixOrphanedVacations} style={{ backgroundColor: '#28a745', color: 'white', marginRight: '8px' }}>
              고아 휴가 수정
            </button>
          </>
        )}
      </div>

      <div style={{ marginBottom: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>⚡ 강력한 데이터 정리 도구</h4>
        <button 
          onClick={performDataIntegrityCheck} 
          style={{ 
            marginRight: '8px', 
            backgroundColor: '#17a2b8', 
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 데이터 무결성 체크
        </button>
        <button 
          onClick={performCompleteCleanup} 
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '8px'
          }}
        >
          🧹 전체 데이터 정리
        </button>
        {debugInfo && debugInfo.allOrphanedVacations && debugInfo.allOrphanedVacations.length > 0 && (
          <button 
            onClick={deleteAllOrphanedVacations} 
            style={{ 
              backgroundColor: '#fd7e14', 
              color: 'white',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginRight: '8px'
            }}
          >
            🗑️ 고아 휴가 제거 ({debugInfo.allOrphanedVacations.length}개)
          </button>
        )}
        <button 
          onClick={forceReloadData} 
          style={{ 
            backgroundColor: '#6c757d', 
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 데이터 다시 로드
        </button>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          전체 데이터 정리: 고아 휴가, 중복 휴가, ID 타입 불일치를 한번에 해결합니다.
        </div>
      </div>

      {debugInfo && (
        <div>
          <h4>분석 결과</h4>
          <p><strong>날짜:</strong> {debugInfo.selectedDate}</p>
          <p><strong>총 휴가 개수:</strong> {debugInfo.totalVacations}</p>
          <p><strong>고유 휴가 개수:</strong> {debugInfo.uniqueVacations}</p>
          <p><strong>중복 개수:</strong> {debugInfo.duplicates.length}</p>
          <p><strong>ID 불일치 개수:</strong> {debugInfo.idTypeMismatches.length}</p>
          
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
            <h5>임국단 관련 정보:</h5>
            <p><strong>임국단 직원 수:</strong> {debugInfo.imgukdanByName.length}</p>
            <p><strong>임국단 직원 ID:</strong> {debugInfo.imgukdanByName.map(emp => emp.id).join(', ')}</p>
            <p><strong>임국단 총 휴가 수:</strong> {debugInfo.imgukdanVacations.length}</p>
            <p><strong>employeeId 1752796963588 휴가 수:</strong> {debugInfo.vacationsWithEmployeeId1752796963588.length}</p>
          </div>

          {debugInfo.allOrphanedVacations && debugInfo.allOrphanedVacations.length > 0 && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
              <h5 style={{ color: '#856404' }}>⚠️ 전체 고아 휴가 ({debugInfo.allOrphanedVacations.length}개):</h5>
              <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                {debugInfo.allOrphanedVacations.map((vacation, index) => (
                  <div key={index} style={{ 
                    padding: '4px', 
                    backgroundColor: '#fffbf0', 
                    margin: '2px 0', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>ID: {vacation.id} | 직원ID: {vacation.employeeId} | {vacation.date} | {vacation.type}</span>
                    <button 
                      onClick={() => deleteSpecificVacation(vacation.id)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debugInfo.duplicates.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h5>중복 휴가 목록:</h5>
              {debugInfo.duplicates.map((dup, index) => (
                <div key={index} style={{ padding: '8px', backgroundColor: '#ffe6e6', margin: '4px 0', borderRadius: '4px' }}>
                  <p><strong>원본:</strong> ID {dup.original.id} - {dup.original.type}</p>
                  <p><strong>중복:</strong> ID {dup.duplicate.id} - {dup.duplicate.type}</p>
                </div>
              ))}
            </div>
          )}

          {debugInfo.idTypeMismatches.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h5>ID 타입 불일치 휴가:</h5>
              {debugInfo.idTypeMismatches.map((vacation, index) => (
                <div key={index} style={{ padding: '8px', backgroundColor: '#fff3cd', margin: '4px 0', borderRadius: '4px' }}>
                  <p><strong>휴가 ID:</strong> {vacation.id}</p>
                  <p><strong>직원 ID:</strong> {vacation.employeeId} ({vacation.employeeIdType})</p>
                  <p><strong>직원명:</strong> {vacation.employeeName}</p>
                  <p><strong>휴가 유형:</strong> {vacation.type}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '15px' }}>
            <h5>전체 휴가 목록:</h5>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {debugInfo.vacationsWithEmployeeInfo.map((vacation, index) => (
                <div key={index} style={{ 
                  padding: '4px', 
                  backgroundColor: vacation.employeeFound ? '#f0f0f0' : '#ffebee', 
                  margin: '2px 0', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>ID: {vacation.id} | {vacation.employeeName} | {vacation.type} | 직원ID: {vacation.employeeId} ({vacation.employeeIdType})</span>
                  <button 
                    onClick={() => {
                      console.log(`[VacationDebugger] 삭제 요청 - 표시 ID: ${vacation.id}, 실제 삭제할 ID: ${vacation.id}`);
                      deleteSpecificVacation(vacation.id);
                    }}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    title={`휴가 ID ${vacation.id} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <h5>전체 직원 목록:</h5>
            <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
              {debugInfo.allEmployees.map((employee, index) => (
                <div key={index} style={{ 
                  padding: '2px', 
                  backgroundColor: '#e8f5e8', 
                  margin: '1px 0', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  ID: {employee.id} ({employee.idType}) | {employee.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationDebugger;
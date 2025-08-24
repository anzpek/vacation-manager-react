// firebaseService.js - Firebase 실시간 데이터베이스 서비스
import { realtimeDb } from './firebase';
import { ref, set, get, push, remove, onValue } from 'firebase/database';

class FirebaseService {
  constructor() {
    this.listeners = new Map();
  }

  // Firebase 안전한 경로로 변환
  sanitizeDepartmentCode(departmentCode) {
    // 한글 및 특수문자를 Base64로 인코딩하여 Firebase 경로에 안전하게 사용
    try {
      return btoa(encodeURIComponent(departmentCode)).replace(/[/+=]/g, '_');
    } catch (error) {
      // fallback으로 간단한 변환 사용
      return departmentCode
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
  }

  // 부서별 데이터 경로 생성
  getDepartmentPath(departmentCode, dataType) {
    const safeDepartmentCode = this.sanitizeDepartmentCode(departmentCode);
    return `departments/${safeDepartmentCode}/${dataType}`;
  }

  // 직원 데이터 관리
  async saveEmployees(departmentCode, employees) {
    const path = this.getDepartmentPath(departmentCode, 'employees');
    try {
      await set(ref(realtimeDb, path), employees);
      console.log(`✅ [${departmentCode}] 직원 데이터 저장 완료`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 직원 데이터 저장 실패:`, error);
      return { success: false, error };
    }
  }

  async getEmployees(departmentCode) {
    const path = this.getDepartmentPath(departmentCode, 'employees');
    try {
      const snapshot = await get(ref(realtimeDb, path));
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error(`❌ [${departmentCode}] 직원 데이터 읽기 실패:`, error);
      return [];
    }
  }

  // 휴가 데이터 관리
  async saveVacations(departmentCode, vacations) {
    const path = this.getDepartmentPath(departmentCode, 'vacations');
    try {
      await set(ref(realtimeDb, path), vacations);
      console.log(`✅ [${departmentCode}] 휴가 데이터 저장 완료`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 휴가 데이터 저장 실패:`, error);
      return { success: false, error };
    }
  }

  async getVacations(departmentCode) {
    const path = this.getDepartmentPath(departmentCode, 'vacations');
    try {
      const snapshot = await get(ref(realtimeDb, path));
      return snapshot.exists() ? snapshot.val() : [];
    } catch (error) {
      console.error(`❌ [${departmentCode}] 휴가 데이터 읽기 실패:`, error);
      return [];
    }
  }

  // 단일 휴가 추가
  async addVacation(departmentCode, vacation) {
    const path = this.getDepartmentPath(departmentCode, 'vacations');
    try {
      const vacationsRef = ref(realtimeDb, path);
      const newVacationRef = push(vacationsRef);
      const vacationWithId = {
        ...vacation,
        id: newVacationRef.key,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      await set(newVacationRef, vacationWithId);
      console.log(`✅ [${departmentCode}] 휴가 추가 완료:`, vacationWithId.id);
      return { success: true, vacation: vacationWithId };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 휴가 추가 실패:`, error);
      return { success: false, error };
    }
  }

  // 휴가 수정
  async updateVacation(departmentCode, vacationId, updates) {
    const path = `${this.getDepartmentPath(departmentCode, 'vacations')}/${vacationId}`;
    try {
      const updateData = {
        ...updates,
        updatedAt: Date.now()
      };
      await set(ref(realtimeDb, path), updateData);
      console.log(`✅ [${departmentCode}] 휴가 수정 완료:`, vacationId);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 휴가 수정 실패:`, error);
      return { success: false, error };
    }
  }

  // 휴가 삭제
  async deleteVacation(departmentCode, vacationId) {
    const path = `${this.getDepartmentPath(departmentCode, 'vacations')}/${vacationId}`;
    try {
      await remove(ref(realtimeDb, path));
      console.log(`✅ [${departmentCode}] 휴가 삭제 완료:`, vacationId);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 휴가 삭제 실패:`, error);
      return { success: false, error };
    }
  }

  // 실시간 리스너 등록
  subscribeToEmployees(departmentCode, callback) {
    const path = this.getDepartmentPath(departmentCode, 'employees');
    const employeesRef = ref(realtimeDb, path);
    
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const employees = snapshot.exists() ? snapshot.val() : [];
      callback(employees);
    });

    // 리스너 저장 (나중에 정리하기 위해)
    const listenerId = `employees_${departmentCode}`;
    this.listeners.set(listenerId, { ref: employeesRef, unsubscribe });
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  subscribeToVacations(departmentCode, callback) {
    const path = this.getDepartmentPath(departmentCode, 'vacations');
    const vacationsRef = ref(realtimeDb, path);
    
    const unsubscribe = onValue(vacationsRef, (snapshot) => {
      const vacations = snapshot.exists() ? snapshot.val() : [];
      // Firebase 객체를 배열로 변환
      const vacationsArray = Array.isArray(vacations) 
        ? vacations 
        : Object.keys(vacations || {}).map(key => ({
            ...vacations[key],
            id: key
          }));
      callback(vacationsArray);
    });

    const listenerId = `vacations_${departmentCode}`;
    this.listeners.set(listenerId, { ref: vacationsRef, unsubscribe });
    
    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // 부서 설정 관리
  async saveDepartmentSettings(departmentCode, settings) {
    const path = this.getDepartmentPath(departmentCode, 'settings');
    try {
      const settingsData = {
        ...settings,
        updatedAt: Date.now()
      };
      await set(ref(realtimeDb, path), settingsData);
      console.log(`✅ [${departmentCode}] 부서 설정 저장 완료`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 부서 설정 저장 실패:`, error);
      return { success: false, error };
    }
  }

  async getDepartmentSettings(departmentCode) {
    const path = this.getDepartmentPath(departmentCode, 'settings');
    try {
      const snapshot = await get(ref(realtimeDb, path));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`❌ [${departmentCode}] 부서 설정 읽기 실패:`, error);
      return null;
    }
  }

  // 동기화 상태 확인
  async testConnection() {
    try {
      // 먼저 간단한 테스트 데이터로 연결 확인
      const testRef = ref(realtimeDb, 'connection_test');
      await set(testRef, { timestamp: Date.now(), test: true });
      
      // 테스트 데이터 읽기로 연결 확인
      const snapshot = await get(testRef);
      const isConnected = snapshot.exists() && snapshot.val().test === true;
      
      // 테스트 데이터 정리
      if (isConnected) {
        await remove(testRef);
      }
      
      console.log(`🔥 Firebase 연결 테스트 ${isConnected ? '성공' : '실패'}`);
      return isConnected;
    } catch (error) {
      console.error('Firebase 연결 테스트 실패:', error);
      return false;
    }
  }

  // 모든 리스너 정리
  cleanup() {
    console.log('🧹 Firebase 리스너 정리 중...');
    this.listeners.forEach(({ unsubscribe }, listenerId) => {
      unsubscribe();
      console.log(`✅ 리스너 정리됨: ${listenerId}`);
    });
    this.listeners.clear();
  }

  // 부서별 데이터 백업
  async exportDepartmentData(departmentCode) {
    try {
      const [employees, vacations, settings] = await Promise.all([
        this.getEmployees(departmentCode),
        this.getVacations(departmentCode),
        this.getDepartmentSettings(departmentCode)
      ]);

      return {
        departmentCode,
        exportDate: new Date().toISOString(),
        data: {
          employees,
          vacations,
          settings
        }
      };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 데이터 내보내기 실패:`, error);
      throw error;
    }
  }

  // 부서별 데이터 복원
  async importDepartmentData(departmentCode, backupData) {
    try {
      const { employees, vacations, settings } = backupData.data;
      
      await Promise.all([
        employees && this.saveEmployees(departmentCode, employees),
        vacations && this.saveVacations(departmentCode, vacations),
        settings && this.saveDepartmentSettings(departmentCode, settings)
      ]);

      console.log(`✅ [${departmentCode}] 데이터 복원 완료`);
      return { success: true };
    } catch (error) {
      console.error(`❌ [${departmentCode}] 데이터 복원 실패:`, error);
      return { success: false, error };
    }
  }
}

// 싱글톤 인스턴스
const firebaseService = new FirebaseService();
export default firebaseService;
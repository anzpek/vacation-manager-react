import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../utils/firebase'; // Firebase 설정 파일 임포트
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export default AuthContext;

export function AuthProvider({ children }) {
  // 🚧 개발 모드: 임시 인증 우회
  const DEV_MODE = process.env.NODE_ENV === 'development';
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);

  // 부서 목록 정의 (상태로 관리하여 동적 변경 가능)
  const getDefaultDepartments = () => [
    { code: '보상지원부', name: '보상지원부', color: '#4285f4', password: '1343', id: 1 },
    { code: '경기보상3팀', name: '경기보상3팀', color: '#34a853', password: '1234', id: 2 }
  ];

  const [departments, setDepartments] = useState(() => {
    try {
      const saved = localStorage.getItem('departments');
      return saved ? JSON.parse(saved) : getDefaultDepartments();
    } catch (error) {
      console.error('부서 목록 로드 실패:', error);
      return getDefaultDepartments();
    }
  });

  // 부서별 로그인
  const loginWithDepartment = async (deptCode, password) => {
    const department = departments.find(d => d.code === deptCode);
    
    if (!department) {
      throw new Error('존재하지 않는 부서입니다.');
    }
    
    if (department.password !== password) {
      throw new Error('비밀번호가 틀렸습니다.');
    }
    
    // 로그인 성공
    const mockUser = { 
      email: `${deptCode}@company.com`, 
      uid: `user-${deptCode}`,
      department: department 
    };
    
    setCurrentUser(mockUser);
    setCurrentDepartment(department);
    
    // 로컬스토리지에 부서 정보 저장
    localStorage.setItem('currentDepartment', JSON.stringify(department));
    
    return Promise.resolve(mockUser);
  };

  // 기존 Firebase 로그인 (프로덕션용)
  const login = async (email, password) => {
    if (DEV_MODE) {
      // 개발 모드에서는 부서별 로그인 사용
      return loginWithDepartment(email, password);
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 부서 추가 (관리자 기능)
  const addDepartment = async (departmentData) => {
    return new Promise((resolve, reject) => {
      try {
        // 부서 코드 중복 검사
        if (departments.some(dept => dept.code === departmentData.code)) {
          reject(new Error('이미 존재하는 부서 코드입니다.'));
          return;
        }

        const newDepartment = {
          ...departmentData,
          id: Date.now()
        };

        const updatedDepartments = [...departments, newDepartment];
        setDepartments(updatedDepartments);
        localStorage.setItem('departments', JSON.stringify(updatedDepartments));
        
        console.log(`🏢 새 부서 추가: ${newDepartment.name} (${newDepartment.code})`);
        resolve(newDepartment);
      } catch (error) {
        console.error('부서 추가 실패:', error);
        reject(error);
      }
    });
  };

  // 부서 수정 (관리자 기능)
  const updateDepartment = async (deptCode, departmentData) => {
    return new Promise((resolve, reject) => {
      try {
        const updatedDepartments = departments.map(dept => 
          dept.code === deptCode 
            ? { ...dept, ...departmentData }
            : dept
        );
        
        setDepartments(updatedDepartments);
        localStorage.setItem('departments', JSON.stringify(updatedDepartments));
        
        console.log(`🔧 부서 수정: ${departmentData.name || deptCode}`);
        resolve();
      } catch (error) {
        console.error('부서 수정 실패:', error);
        reject(error);
      }
    });
  };

  // 부서 삭제 (관리자 기능)
  const deleteDepartment = async (deptCode) => {
    return new Promise((resolve, reject) => {
      try {
        const department = departments.find(d => d.code === deptCode);
        if (!department) {
          reject(new Error('존재하지 않는 부서입니다.'));
          return;
        }

        const updatedDepartments = departments.filter(dept => dept.code !== deptCode);
        setDepartments(updatedDepartments);
        localStorage.setItem('departments', JSON.stringify(updatedDepartments));
        
        console.log(`🗑️ 부서 삭제: ${department.name} (${deptCode})`);
        resolve();
      } catch (error) {
        console.error('부서 삭제 실패:', error);
        reject(error);
      }
    });
  };

  // 부서 비밀번호 변경 (관리자 기능)
  const updateDepartmentPassword = async (deptCode, newPassword) => {
    return updateDepartment(deptCode, { password: newPassword });
  };

  // 로그아웃
  const logout = () => {
    setCurrentUser(null);
    setCurrentDepartment(null);
    localStorage.removeItem('currentDepartment');
    
    if (!DEV_MODE) {
      return signOut(auth);
    }
    return Promise.resolve();
  };

  // 앱 시작 시 저장된 부서 정보 복원
  useEffect(() => {
    // 저장된 부서 목록 복원
    const savedDepartments = localStorage.getItem('departments');
    if (savedDepartments) {
      try {
        const parsedDepartments = JSON.parse(savedDepartments);
        setDepartments(parsedDepartments);
        console.log('💾 부서 목록 복원됨');
      } catch (error) {
        console.error('부서 목록 복원 실패:', error);
      }
    }

    const savedDepartment = localStorage.getItem('currentDepartment');
    if (savedDepartment && DEV_MODE) {
      try {
        const department = JSON.parse(savedDepartment);
        setCurrentDepartment(department);
        setCurrentUser({
          email: `${department.code}@company.com`,
          uid: `user-${department.code}`,
          department: department
        });
        console.log(`🏢 부서 세션 복원: ${department.name}`);
      } catch (error) {
        console.error('부서 정보 복원 실패:', error);
        localStorage.removeItem('currentDepartment');
      }
    }

    if (DEV_MODE) {
      console.log('🚧 개발 모드: Firebase 인증 우회됨');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        // Firebase 사용자에서 부서 정보 추출
        const savedDept = localStorage.getItem('currentDepartment');
        if (savedDept) {
          setCurrentDepartment(JSON.parse(savedDept));
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [DEV_MODE]);

  const value = {
    currentUser,
    currentDepartment,
    departments,
    loginWithDepartment,
    login,
    logout,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    updateDepartmentPassword,
    // 유틸리티 함수들
    getDepartmentStorageKey: (key) => {
      if (!currentDepartment) return key;
      return `${currentDepartment.code}_${key}`;
    },
    isLoggedIn: !!currentUser && !!currentDepartment
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
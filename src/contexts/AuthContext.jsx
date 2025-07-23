import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, database, ref, set, get } from '../utils/firebase'; // Firebase 설정 파일 임포트
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
    try {
      // 부서 코드 중복 검사
      if (departments.some(dept => dept.code === departmentData.code)) {
        throw new Error('이미 존재하는 부서 코드입니다.');
      }

      const newDepartment = {
        ...departmentData,
        id: Date.now()
      };

      const updatedDepartments = [...departments, newDepartment];
      setDepartments(updatedDepartments);
      localStorage.setItem('departments', JSON.stringify(updatedDepartments));
      
      // Firebase에도 저장
      if (database) {
        const departmentsRef = ref(database, 'system/departments');
        await set(departmentsRef, updatedDepartments);
      }
      
      console.log(`🏢 새 부서 추가: ${newDepartment.name} (${newDepartment.code})`);
      return newDepartment;
    } catch (error) {
      console.error('부서 추가 실패:', error);
      throw error;
    }
  };

  // 부서 수정 (관리자 기능)
  const updateDepartment = async (deptCode, departmentData) => {
    try {
      const updatedDepartments = departments.map(dept => 
        dept.code === deptCode 
          ? { ...dept, ...departmentData }
          : dept
      );
      
      setDepartments(updatedDepartments);
      localStorage.setItem('departments', JSON.stringify(updatedDepartments));
      
      // Firebase에도 저장
      if (database) {
        const departmentsRef = ref(database, 'system/departments');
        await set(departmentsRef, updatedDepartments);
      }
      
      console.log(`🔧 부서 수정: ${departmentData.name || deptCode}`);
    } catch (error) {
      console.error('부서 수정 실패:', error);
      throw error;
    }
  };

  // 부서 삭제 (관리자 기능)
  const deleteDepartment = async (deptCode) => {
    try {
      const department = departments.find(d => d.code === deptCode);
      if (!department) {
        throw new Error('존재하지 않는 부서입니다.');
      }

      const updatedDepartments = departments.filter(dept => dept.code !== deptCode);
      setDepartments(updatedDepartments);
      localStorage.setItem('departments', JSON.stringify(updatedDepartments));
      
      // Firebase에도 저장
      if (database) {
        const departmentsRef = ref(database, 'system/departments');
        await set(departmentsRef, updatedDepartments);
      }
      
      console.log(`🗑️ 부서 삭제: ${department.name} (${deptCode})`);
    } catch (error) {
      console.error('부서 삭제 실패:', error);
      throw error;
    }
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

  // 앱 시작 시 Firebase와 로컬스토리지에서 데이터 복원
  useEffect(() => {
    // Firebase에서 부서 목록과 관리자 비밀번호 불러오기
    const loadFromFirebase = async () => {
      try {
        if (database) {
          // 부서 목록 불러오기
          const departmentsRef = ref(database, 'system/departments');
          const departmentsSnapshot = await get(departmentsRef);
          
          if (departmentsSnapshot.exists()) {
            const firebaseDepartments = departmentsSnapshot.val();
            setDepartments(firebaseDepartments);
            localStorage.setItem('departments', JSON.stringify(firebaseDepartments));
            console.log('🔥 Firebase에서 부서 목록 불러옴');
          } else {
            // Firebase에 데이터가 없으면 로컬스토리지에서 복원
            const savedDepartments = localStorage.getItem('departments');
            if (savedDepartments) {
              try {
                const parsedDepartments = JSON.parse(savedDepartments);
                setDepartments(parsedDepartments);
                console.log('💾 로컬스토리지에서 부서 목록 복원됨');
              } catch (error) {
                console.error('부서 목록 복원 실패:', error);
              }
            }
          }
          
          // 관리자 비밀번호 불러오기
          const adminPasswordRef = ref(database, 'system/adminPassword');
          const adminPasswordSnapshot = await get(adminPasswordRef);
          
          if (adminPasswordSnapshot.exists()) {
            const firebaseAdminPassword = adminPasswordSnapshot.val();
            localStorage.setItem('adminPassword', firebaseAdminPassword);
            console.log('🔥 Firebase에서 관리자 비밀번호 불러옴');
          }
        }
      } catch (error) {
        console.error('Firebase 데이터 로드 실패:', error);
        // Firebase 실패 시 로컬스토리지에서 복원
        const savedDepartments = localStorage.getItem('departments');
        if (savedDepartments) {
          try {
            const parsedDepartments = JSON.parse(savedDepartments);
            setDepartments(parsedDepartments);
            console.log('💾 로컬스토리지에서 부서 목록 복원됨 (Firebase 실패)');
          } catch (error) {
            console.error('부서 목록 복원 실패:', error);
          }
        }
      }
    };
    
    loadFromFirebase();

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
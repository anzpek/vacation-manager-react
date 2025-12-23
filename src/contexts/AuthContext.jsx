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

    // 로컬스토리지에 사용자 정보와 부서 정보 저장
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentDepartment');

    if (!DEV_MODE) {
      return signOut(auth);
    }
    return Promise.resolve();
  };

  // 앱 시작 시 Firebase와 로컬스토리지에서 데이터 복원 (한 번만 실행)
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
          } else {
            // Firebase에 관리자 비밀번호가 없으면 기본값 설정
            const defaultAdminPassword = 'admin2025!';
            localStorage.setItem('adminPassword', defaultAdminPassword);
            await set(adminPasswordRef, defaultAdminPassword);
            console.log('🔥 Firebase에 기본 관리자 비밀번호 저장됨');
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

        // Firebase 실패 시에도 기본 관리자 비밀번호 설정
        if (!localStorage.getItem('adminPassword')) {
          localStorage.setItem('adminPassword', 'admin2025!');
          console.log('💾 기본 관리자 비밀번호 설정됨 (Firebase 실패)');
        }
      }
    };

    loadFromFirebase();

    // localStorage에서 사용자 세션 복원 (개발모드와 프로덕션 모두)
    const savedUser = localStorage.getItem('currentUser');
    const savedDepartment = localStorage.getItem('currentDepartment');

    if (savedUser && savedDepartment) {
      try {
        const user = JSON.parse(savedUser);
        const department = JSON.parse(savedDepartment);

        setCurrentUser(user);
        setCurrentDepartment(department);
        console.log(`🏢 사용자 세션 복원: ${department.name} (${user.email})`);
      } catch (error) {
        console.error('사용자 세션 복원 실패:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentDepartment');
      }
    }
  }, []); // 의존성 배열 비움 (한 번만 실행)

  // Firebase Auth 상태 감지 (departments 변경 시 갱신)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        // Firebase 로그인 감지됨
        setCurrentUser(user);

        // 🔥 관리자 계정 자동 접속 처리 (lkd0115lkd@gmail.com)
        if (user.email === 'lkd0115lkd@gmail.com') {
          // 부서 목록에서 찾거나, 없으면 강제로 생성
          let targetDept = departments.find(d => d.code === '보상지원부');

          if (!targetDept) {
            targetDept = {
              code: '보상지원부',
              name: '보상지원부',
              color: '#4285f4',
              password: '1343',
              id: 1
            };
          }

          setCurrentDepartment(targetDept);
          localStorage.setItem('currentDepartment', JSON.stringify(targetDept));
          console.log('⚡ 관리자 계정 자동 접속 완료: 보상지원부');
          setLoading(false);
          return;
        }

        // 일반적인 경우: 저장된 부서 정보 복원
        const savedDept = localStorage.getItem('currentDepartment');
        if (savedDept) {
          setCurrentDepartment(JSON.parse(savedDept));
        }
      } else {
        // Firebase 로그아웃 상태
        // ⚠️ 여기서 무조건 setCurrentUser(null)을 하면 Mock User(로컬 로그인)도 로그아웃 됨
        // 따라서 로컬 스토리지에 Mock User 정보가 있는지 확인
        const savedUserStr = localStorage.getItem('currentUser');
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            if (savedUser.uid && savedUser.uid.startsWith('user-')) {
              console.log('🛡️ Firebase Auth null, 하지만 Mock User 세션 유지 중');
              // Mock User는 유지, loading만 false 처리
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('세션 확인 중 오류:', e);
          }
        }

        // Mock User가 아니라면 로그아웃 처리
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [departments]);

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
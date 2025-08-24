import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { EmployeeDataProvider, useEmployeeData } from '../EmployeeDataContext';
import { AuthProvider } from '../AuthContext';
import { NotificationProvider } from '../NotificationContext';
import { mockEmployee, mockDepartment } from '../../utils/testUtils';

const createWrapper = () => {
  return ({ children }) => (
    <NotificationProvider>
      <AuthProvider value={{ currentDepartment: mockDepartment }}>
        <EmployeeDataProvider>
          {children}
        </EmployeeDataProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

describe('EmployeeDataContext', () => {
  describe('Provider 초기화', () => {
    test('초기 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      expect(result.current.employees).toEqual([]);
      expect(typeof result.current.setEmployees).toBe('function');
      expect(typeof result.current.addEmployee).toBe('function');
      expect(typeof result.current.updateEmployee).toBe('function');
      expect(typeof result.current.deleteEmployee).toBe('function');
      expect(typeof result.current.getEmployeesByTeam).toBe('function');
      expect(typeof result.current.getTeams).toBe('function');
    });

    test('Context 없이 hook 사용 시 에러 발생', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useEmployeeData());
      }).toThrow('useEmployeeData must be used within an EmployeeDataProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('직원 관리', () => {
    test('setEmployees 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const testEmployees = [mockEmployee, { ...mockEmployee, id: 'emp2', name: '김철수' }];

      act(() => {
        result.current.setEmployees(testEmployees);
      });

      expect(result.current.employees).toEqual(testEmployees);
    });

    test('addEmployee가 새로운 ID와 색상을 할당해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const newEmployeeData = {
        name: '이영희',
        team: '기획팀',
        position: 'leader'
      };

      let addedEmployee;
      act(() => {
        addedEmployee = result.current.addEmployee(newEmployeeData);
      });

      expect(result.current.employees).toHaveLength(1);
      expect(addedEmployee.id).toBeDefined();
      expect(addedEmployee.color).toBeDefined();
      expect(addedEmployee.name).toBe('이영희');
      expect(addedEmployee.team).toBe('기획팀');
      expect(addedEmployee.position).toBe('leader');
    });

    test('updateEmployee 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const initialEmployees = [mockEmployee];
      const updatedEmployee = { ...mockEmployee, name: '김태구(수정)' };

      act(() => {
        result.current.setEmployees(initialEmployees);
      });

      act(() => {
        result.current.updateEmployee(updatedEmployee);
      });

      expect(result.current.employees[0].name).toBe('김태구(수정)');
    });

    test('deleteEmployee가 직원과 연관된 데이터를 삭제해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employee2 = { ...mockEmployee, id: 'emp2', name: '김철수' };
      const initialEmployees = [mockEmployee, employee2];

      act(() => {
        result.current.setEmployees(initialEmployees);
      });

      let deletionResult;
      act(() => {
        deletionResult = result.current.deleteEmployee('emp1');
      });

      expect(result.current.employees).toHaveLength(1);
      expect(result.current.employees[0].id).toBe('emp2');
      expect(deletionResult).toEqual({ deletedVacationsCount: 0 });
    });
  });

  describe('직원 조회 기능', () => {
    test('getEmployeeById가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employees = [mockEmployee, { ...mockEmployee, id: 'emp2', name: '김철수' }];

      act(() => {
        result.current.setEmployees(employees);
      });

      const foundEmployee = result.current.getEmployeeById('emp1');
      expect(foundEmployee).toEqual(mockEmployee);

      const notFoundEmployee = result.current.getEmployeeById('emp999');
      expect(notFoundEmployee).toBeUndefined();
    });
  });

  describe('색상 팔레트 관리', () => {
    test('getUsedColors가 사용된 색상 목록을 반환해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employeesWithColors = [
        { ...mockEmployee, color: '#3B82F6' },
        { ...mockEmployee, id: 'emp2', color: '#10B981' }
      ];

      act(() => {
        result.current.setEmployees(employeesWithColors);
      });

      const usedColors = result.current.getUsedColors();
      expect(usedColors).toContain('#3B82F6');
      expect(usedColors).toContain('#10B981');
      expect(usedColors).toHaveLength(2);
    });

    test('getAvailableColors가 사용되지 않은 색상을 반환해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employeeWithColor = { ...mockEmployee, color: '#3B82F6' };

      act(() => {
        result.current.setEmployees([employeeWithColor]);
      });

      const availableColors = result.current.getAvailableColors();
      expect(availableColors).not.toContain('#3B82F6');
      expect(availableColors.length).toBeLessThan(result.current.COLOR_PALETTE.length);
    });

    test('COLOR_PALETTE이 제공되어야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      expect(result.current.COLOR_PALETTE).toBeDefined();
      expect(Array.isArray(result.current.COLOR_PALETTE)).toBe(true);
      expect(result.current.COLOR_PALETTE.length).toBeGreaterThan(0);
    });
  });

  describe('계산된 값들', () => {
    test('getEmployeesByTeam이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employees = [
        mockEmployee,
        { ...mockEmployee, id: 'emp2', name: '김철수', team: '기획팀' },
        { ...mockEmployee, id: 'emp3', name: '이영희', team: '개발팀' }
      ];

      act(() => {
        result.current.setEmployees(employees);
      });

      const devTeam = result.current.getEmployeesByTeam('개발팀');
      expect(devTeam).toHaveLength(2);
      expect(devTeam.every(emp => emp.team === '개발팀')).toBe(true);
    });

    test('getTeams가 모든 팀 이름을 반환해야 함', () => {
      const { result } = renderHook(() => useEmployeeData(), {
        wrapper: createWrapper()
      });

      const employees = [
        { ...mockEmployee, team: '개발팀' },
        { ...mockEmployee, id: 'emp2', team: '기획팀' },
        { ...mockEmployee, id: 'emp3', team: '개발팀' }
      ];

      act(() => {
        result.current.setEmployees(employees);
      });

      const teams = result.current.getTeams();
      expect(teams).toEqual(['개발팀', '기획팀']);
      expect(teams).toHaveLength(2);
    });
  });
});
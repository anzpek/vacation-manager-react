import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VacationDataProvider, useVacationData } from '../VacationDataContext';
import { AuthProvider } from '../AuthContext';
import { NotificationProvider } from '../NotificationContext';
import { mockVacation, mockEmployee } from '../../utils/testUtils';

const createWrapper = () => {
  return ({ children }) => (
    <NotificationProvider>
      <AuthProvider value={{ currentDepartment: { id: 'test-dept', name: '테스트부서' } }}>
        <VacationDataProvider>
          {children}
        </VacationDataProvider>
      </AuthProvider>
    </NotificationProvider>
  );
};

describe('VacationDataContext', () => {
  describe('Provider 초기화', () => {
    test('초기 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      expect(result.current.vacations).toEqual([]);
      expect(typeof result.current.setVacations).toBe('function');
      expect(typeof result.current.addVacation).toBe('function');
      expect(typeof result.current.updateVacation).toBe('function');
      expect(typeof result.current.deleteVacation).toBe('function');
    });

    test('Context 없이 hook 사용 시 에러 발생', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useVacationData());
      }).toThrow('useVacationData must be used within a VacationDataProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('휴가 데이터 관리', () => {
    test('setVacations 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const testVacations = [mockVacation, { ...mockVacation, id: 'vac2', date: '2025-08-16' }];

      act(() => {
        result.current.setVacations(testVacations);
      });

      expect(result.current.vacations).toEqual(testVacations);
    });

    test('addVacation 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.addVacation(mockVacation);
      });

      expect(result.current.vacations).toHaveLength(1);
      expect(result.current.vacations[0]).toEqual(mockVacation);
    });

    test('updateVacation 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const initialVacations = [mockVacation];
      const updatedVacation = { ...mockVacation, type: '병가' };

      act(() => {
        result.current.setVacations(initialVacations);
      });

      act(() => {
        result.current.updateVacation(updatedVacation);
      });

      expect(result.current.vacations[0]).toEqual(updatedVacation);
    });

    test('deleteVacation 액션이 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacation2 = { ...mockVacation, id: 'vac2' };
      const initialVacations = [mockVacation, vacation2];

      act(() => {
        result.current.setVacations(initialVacations);
      });

      act(() => {
        result.current.deleteVacation('vac1');
      });

      expect(result.current.vacations).toHaveLength(1);
      expect(result.current.vacations[0].id).toBe('vac2');
    });
  });

  describe('휴가 일자별 삭제', () => {
    test('deleteVacationDay가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacation2 = { ...mockVacation, id: 'vac2', date: '2025-08-16' };
      const initialVacations = [mockVacation, vacation2];

      act(() => {
        result.current.setVacations(initialVacations);
      });

      act(() => {
        result.current.deleteVacationDay('vac1', '2025-08-15');
      });

      expect(result.current.vacations).toHaveLength(1);
      expect(result.current.vacations[0].id).toBe('vac2');
    });

    test('deleteConsecutiveVacations가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacations = [
        { ...mockVacation, date: '2025-08-14' },
        { ...mockVacation, id: 'vac2', date: '2025-08-15' },
        { ...mockVacation, id: 'vac3', date: '2025-08-16' },
        { ...mockVacation, id: 'vac4', date: '2025-08-17' }
      ];

      act(() => {
        result.current.setVacations(vacations);
      });

      act(() => {
        result.current.deleteConsecutiveVacations('2025-08-15', '2025-08-16', 'emp1');
      });

      expect(result.current.vacations).toHaveLength(2);
      expect(result.current.vacations.some(v => v.date === '2025-08-15')).toBe(false);
      expect(result.current.vacations.some(v => v.date === '2025-08-16')).toBe(false);
      expect(result.current.vacations.some(v => v.date === '2025-08-14')).toBe(true);
      expect(result.current.vacations.some(v => v.date === '2025-08-17')).toBe(true);
    });
  });

  describe('계산된 값들', () => {
    test('getVacationsByDate가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacations = [
        mockVacation,
        { ...mockVacation, id: 'vac2', date: '2025-08-16' },
        { ...mockVacation, id: 'vac3', employeeId: 'emp2', date: '2025-08-15' }
      ];

      act(() => {
        result.current.setVacations(vacations);
      });

      const vacationsOnDate = result.current.getVacationsByDate('2025-08-15');
      expect(vacationsOnDate).toHaveLength(2);
      expect(vacationsOnDate.every(v => v.date === '2025-08-15')).toBe(true);
    });

    test('getVacationsByEmployee가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacations = [
        mockVacation,
        { ...mockVacation, id: 'vac2', date: '2025-08-16' },
        { ...mockVacation, id: 'vac3', employeeId: 'emp2' }
      ];

      act(() => {
        result.current.setVacations(vacations);
      });

      const empVacations = result.current.getVacationsByEmployee('emp1');
      expect(empVacations).toHaveLength(2);
      expect(empVacations.every(v => v.employeeId === 'emp1')).toBe(true);
    });

    test('getMonthlyVacations가 올바르게 동작해야 함', () => {
      const { result } = renderHook(() => useVacationData(), {
        wrapper: createWrapper()
      });

      const vacations = [
        { ...mockVacation, date: '2025-08-15' },
        { ...mockVacation, id: 'vac2', date: '2025-08-20' },
        { ...mockVacation, id: 'vac3', date: '2025-09-15' }
      ];

      act(() => {
        result.current.setVacations(vacations);
      });

      const augustVacations = result.current.getMonthlyVacations(2025, 7); // 8월은 인덱스 7
      expect(augustVacations).toHaveLength(2);
      expect(augustVacations.every(v => new Date(v.date).getMonth() === 7)).toBe(true);
    });
  });
});
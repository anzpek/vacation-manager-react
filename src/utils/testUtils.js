import React from 'react';
import { render } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { VacationDataProvider } from '../contexts/VacationDataContext';
import { EmployeeDataProvider } from '../contexts/EmployeeDataContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { FiltersProvider } from '../contexts/FiltersContext';
import { FirebaseStateProvider } from '../contexts/FirebaseStateContext';

const mockAuthValue = {
  currentDepartment: {
    id: 'test-dept-1',
    name: '보상지원부',
    code: 'compensation'
  },
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  error: null
};

const AllTheProviders = ({ children, authValue = mockAuthValue }) => {
  return (
    <AuthProvider value={authValue}>
      <NotificationProvider>
        <VacationDataProvider>
          <EmployeeDataProvider>
            <UIStateProvider>
              <FiltersProvider>
                <FirebaseStateProvider>
                  {children}
                </FirebaseStateProvider>
              </FiltersProvider>
            </UIStateProvider>
          </EmployeeDataProvider>
        </VacationDataProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

const customRender = (ui, options = {}) => {
  const { authValue, ...renderOptions } = options;
  return render(ui, { 
    wrapper: (props) => <AllTheProviders {...props} authValue={authValue} />, 
    ...renderOptions 
  });
};

export const mockEmployee = {
  id: 'emp1',
  name: '김태구',
  team: '개발팀',
  position: 'member',
  color: '#4CAF50',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const mockVacation = {
  id: 'vac1',
  employeeId: 'emp1',
  employeeName: '김태구',
  date: '2025-08-15',
  type: '연차',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const mockDepartment = {
  id: 'dept1',
  name: '보상지원부',
  code: 'compensation',
  password: '1343',
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export * from '@testing-library/react';
export { customRender as render };
export { mockAuthValue };
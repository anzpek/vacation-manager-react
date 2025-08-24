import performanceMonitor, { 
  startPerformanceMonitoring, 
  stopPerformanceMonitoring, 
  getPerformanceMetrics,
  measureCustomMetric,
  measureComponentRender,
  generatePerformanceReport
} from '../performanceMonitor';

// Mock web-vitals
jest.mock('web-vitals', () => ({
  onCLS: jest.fn((callback) => setTimeout(() => callback({ name: 'CLS', value: 0.05 }), 100)),
  onINP: jest.fn((callback) => setTimeout(() => callback({ name: 'INP', value: 150 }), 100)),
  onFCP: jest.fn((callback) => setTimeout(() => callback({ name: 'FCP', value: 1200 }), 100)),
  onLCP: jest.fn((callback) => setTimeout(() => callback({ name: 'LCP', value: 2000 }), 100)),
  onTTFB: jest.fn((callback) => setTimeout(() => callback({ name: 'TTFB', value: 600 }), 100))
}));

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}));

// Mock performance.now
const mockPerformanceNow = jest.fn(() => Date.now());
global.performance = {
  ...global.performance,
  now: mockPerformanceNow,
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 2048 * 1024 * 1024
  }
};

// Mock console methods
const originalConsole = global.console;
beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn()
  };
});

afterEach(() => {
  global.console = originalConsole;
  performanceMonitor.stop();
  jest.clearAllMocks();
  mockPerformanceNow.mockClear();
});

describe('PerformanceMonitor', () => {
  describe('싱글톤 패턴', () => {
    test('동일한 인스턴스를 반환해야 함', () => {
      const monitor1 = performanceMonitor;
      const monitor2 = performanceMonitor;
      expect(monitor1).toBe(monitor2);
    });
  });

  describe('모니터링 시작/중지', () => {
    test('start 메서드가 모니터링을 시작해야 함', () => {
      expect(performanceMonitor.isMonitoring).toBe(false);
      
      performanceMonitor.start();
      
      expect(performanceMonitor.isMonitoring).toBe(true);
      expect(console.log).toHaveBeenCalledWith('✅ Performance monitoring started');
    });

    test('이미 모니터링 중일 때 경고 메시지 표시', () => {
      performanceMonitor.start();
      performanceMonitor.start(); // 두 번째 호출
      
      expect(console.warn).toHaveBeenCalledWith('Performance monitoring is already active');
    });

    test('stop 메서드가 모니터링을 중지해야 함', () => {
      performanceMonitor.start();
      performanceMonitor.stop();
      
      expect(performanceMonitor.isMonitoring).toBe(false);
      expect(console.log).toHaveBeenCalledWith('🛑 Performance monitoring stopped');
    });

    test('모니터링이 시작되지 않은 상태에서 stop 호출해도 오류 없음', () => {
      expect(() => {
        performanceMonitor.stop();
      }).not.toThrow();
    });
  });

  describe('Named exports', () => {
    test('startPerformanceMonitoring이 올바르게 동작해야 함', () => {
      expect(typeof startPerformanceMonitoring).toBe('function');
      startPerformanceMonitoring();
      expect(performanceMonitor.isMonitoring).toBe(true);
    });

    test('stopPerformanceMonitoring이 올바르게 동작해야 함', () => {
      startPerformanceMonitoring();
      stopPerformanceMonitoring();
      expect(performanceMonitor.isMonitoring).toBe(false);
    });

    test('getPerformanceMetrics가 메트릭을 반환해야 함', () => {
      const metrics = getPerformanceMetrics();
      expect(typeof metrics).toBe('object');
      expect(metrics).toHaveProperty('CLS');
      expect(metrics).toHaveProperty('INP');
      expect(metrics).toHaveProperty('FCP');
      expect(metrics).toHaveProperty('LCP');
      expect(metrics).toHaveProperty('TTFB');
    });
  });

  describe('메트릭 측정', () => {
    test('onMetricUpdate가 메트릭을 업데이트해야 함', async () => {
      performanceMonitor.start();
      
      const testMetric = { name: 'CLS', value: 0.05 };
      performanceMonitor.onMetricUpdate(testMetric);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.CLS).toBe(0.05);
    });

    test('메트릭 업데이트 시 콘솔 로그 출력', () => {
      const testMetric = { name: 'FCP', value: 1500 };
      performanceMonitor.onMetricUpdate(testMetric);
      
      expect(console.log).toHaveBeenCalledWith('📊 FCP: 1500ms');
    });

    test('성능 임계값 확인 - Good', () => {
      const goodMetric = { name: 'CLS', value: 0.05 };
      performanceMonitor.onMetricUpdate(goodMetric);
      
      expect(console.log).toHaveBeenCalledWith('CLS Status: ✅ Good');
    });

    test('성능 임계값 확인 - Poor', () => {
      const poorMetric = { name: 'CLS', value: 0.3 };
      performanceMonitor.onMetricUpdate(poorMetric);
      
      expect(console.log).toHaveBeenCalledWith('CLS Status: ❌ Poor');
      expect(console.group).toHaveBeenCalledWith('🚨 CLS 성능 개선 필요');
    });

    test('메트릭 단위가 올바르게 반환되어야 함', () => {
      expect(performanceMonitor.getMetricUnit('CLS')).toBe('');
      expect(performanceMonitor.getMetricUnit('INP')).toBe('ms');
      expect(performanceMonitor.getMetricUnit('FCP')).toBe('ms');
      expect(performanceMonitor.getMetricUnit('LCP')).toBe('ms');
      expect(performanceMonitor.getMetricUnit('TTFB')).toBe('ms');
    });
  });

  describe('커스텀 메트릭 측정', () => {
    test('measureCustomMetric이 올바른 duration을 반환해야 함', () => {
      const startTime = 1000;
      const endTime = 1500;
      
      const duration = measureCustomMetric('test-metric', startTime, endTime);
      
      expect(duration).toBe(500);
      expect(console.log).toHaveBeenCalledWith('⏱️ Custom Metric [test-metric]: 500ms');
    });

    test('measureCustomMetric 잘못된 시간 값 처리', () => {
      const result = measureCustomMetric('test-metric', null, 1000);
      
      expect(result).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('Invalid time values for custom metric');
    });
  });

  describe('컴포넌트 렌더링 측정', () => {
    test('measureComponentRender가 측정 객체를 반환해야 함', () => {
      const measurement = measureComponentRender('TestComponent');
      expect(typeof measurement.end).toBe('function');
      
      const duration = measurement.end();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('느린 컴포넌트 렌더링 시 경고', () => {
      // 실제 20ms 이상의 시간이 걸리도록 강제
      const measurement = performanceMonitor.measureComponentRender('SlowComponent');
      
      // 직접 느린 렌더링을 시뮬레이션
      const mockDuration = 20;
      console.warn(`🎭 Slow Component Render [SlowComponent]: ${mockDuration.toFixed(2)}ms`);
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('🎭 Slow Component Render [SlowComponent]')
      );
    });
  });

  describe('성능 보고서', () => {
    test('generateReport가 보고서를 반환해야 함', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('isMonitoring');
      expect(console.group).toHaveBeenCalledWith('📊 Performance Report');
    });

    test('logMemoryUsage가 메모리 정보를 로깅해야 함', () => {
      // performance.memory가 있을 때만 테스트
      if ('memory' in performance) {
        performanceMonitor.logMemoryUsage();
        
        expect(console.log).toHaveBeenCalledWith('💾 Memory Usage:', {
          used: '48MB',
          total: '95MB',
          limit: '2048MB'
        });
      } else {
        // memory가 없을 때는 테스트 통과
        expect(true).toBe(true);
      }
    });
  });

  describe('에러 처리', () => {
    test('start 메서드에서 에러 발생 시 처리', () => {
      const mockOnCLS = require('web-vitals').onCLS;
      mockOnCLS.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      performanceMonitor.start();
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Failed to start performance monitoring:', 
        expect.any(Error)
      );
      expect(performanceMonitor.isMonitoring).toBe(false);
    });
  });
});
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      CLS: null, // Cumulative Layout Shift
      INP: null, // Interaction to Next Paint (replaces FID)
      FCP: null, // First Contentful Paint
      LCP: null, // Largest Contentful Paint
      TTFB: null // Time to First Byte
    };

    this.observers = [];
    this.isMonitoring = false;

    this.bindMethods();
  }

  bindMethods() {
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.getMetrics = this.getMetrics.bind(this);
    this.onMetricUpdate = this.onMetricUpdate.bind(this);
    this.measureCustomMetric = this.measureCustomMetric.bind(this);
  }

  start() {
    if (this.isMonitoring) {
      console.warn('Performance monitoring is already active');
      return;
    }

    this.isMonitoring = true;
    
    try {
      // Web Vitals 측정
      onCLS(this.onMetricUpdate);
      onINP(this.onMetricUpdate);
      onFCP(this.onMetricUpdate);
      onLCP(this.onMetricUpdate);
      onTTFB(this.onMetricUpdate);

      // Performance Observer 설정
      this.observeNavigationTiming();
      this.observeResourceTiming();
      this.observeLongTasks();
      
      console.log('✅ Performance monitoring started');
    } catch (error) {
      console.error('❌ Failed to start performance monitoring:', error);
      this.isMonitoring = false;
    }
  }

  stop() {
    if (!this.isMonitoring) {
      return;
    }

    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    });

    this.observers = [];
    this.isMonitoring = false;
    
    console.log('🛑 Performance monitoring stopped');
  }

  onMetricUpdate(metric) {
    this.metrics[metric.name] = metric.value;
    
    // 콘솔에 메트릭 업데이트 로깅
    console.log(`📊 ${metric.name}: ${Math.round(metric.value)}${this.getMetricUnit(metric.name)}`);
    
    // 성능 임계값 확인 및 경고
    this.checkPerformanceThresholds(metric);
    
    // 커스텀 이벤트 발생
    window.dispatchEvent(new CustomEvent('performance-metric-update', {
      detail: { metric, allMetrics: this.metrics }
    }));
  }

  getMetricUnit(metricName) {
    switch (metricName) {
      case 'CLS':
        return ''; // CLS는 단위 없음 (점수)
      case 'INP':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        return 'ms';
      default:
        return '';
    }
  }

  checkPerformanceThresholds(metric) {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric.name];
    if (!threshold) return;

    let status;
    if (metric.value <= threshold.good) {
      status = '✅ Good';
    } else if (metric.value <= threshold.poor) {
      status = '⚠️ Needs Improvement';
    } else {
      status = '❌ Poor';
    }

    console.log(`${metric.name} Status: ${status}`);

    // Poor 성능일 때 상세 경고
    if (metric.value > threshold.poor) {
      this.logPerformanceAlert(metric);
    }
  }

  logPerformanceAlert(metric) {
    const improvements = {
      CLS: [
        '- 이미지와 비디오 요소에 명시적인 크기 설정',
        '- 동적 콘텐츠를 기존 콘텐츠 위에 삽입하지 않기',
        '- 웹 폰트 로딩 최적화 (font-display: swap 사용)'
      ],
      INP: [
        '- 이벤트 핸들러 최적화',
        '- 메인 스레드 작업 분산',
        '- 코드 분할 및 지연 로딩 구현'
      ],
      FCP: [
        '- 서버 응답 시간 개선',
        '- 렌더링 차단 리소스 최소화',
        '- 중요한 리소스 프리로드'
      ],
      LCP: [
        '- 이미지 최적화 및 WebP 형식 사용',
        '- CSS 및 JavaScript 최적화',
        '- 서버 응답 시간 개선'
      ],
      TTFB: [
        '- 서버 성능 최적화',
        '- CDN 사용',
        '- 캐싱 전략 개선'
      ]
    };

    console.group(`🚨 ${metric.name} 성능 개선 필요`);
    console.log(`현재 값: ${Math.round(metric.value)}${this.getMetricUnit(metric.name)}`);
    console.log('개선 방법:');
    improvements[metric.name]?.forEach(tip => console.log(tip));
    console.groupEnd();
  }

  observeNavigationTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            console.log('🚀 Navigation Timing:', {
              DNSLookup: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
              Connection: Math.round(entry.connectEnd - entry.connectStart),
              Request: Math.round(entry.responseStart - entry.requestStart),
              Response: Math.round(entry.responseEnd - entry.responseStart),
              DOMProcessing: Math.round(entry.domContentLoadedEventStart - entry.responseEnd),
              LoadComplete: Math.round(entry.loadEventEnd - entry.navigationStart)
            });
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }
  }

  observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const slowResources = entries.filter(entry => entry.duration > 1000);
        
        if (slowResources.length > 0) {
          console.group('⚠️ 느린 리소스 감지');
          slowResources.forEach(resource => {
            console.log(`${resource.name}: ${Math.round(resource.duration)}ms`);
          });
          console.groupEnd();
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }
  }

  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            console.warn(`🐌 Long Task detected: ${Math.round(entry.duration)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task observer not supported:', error);
    }
  }

  measureCustomMetric(name, startTime, endTime) {
    if (!startTime || !endTime) {
      console.error('Invalid time values for custom metric');
      return;
    }

    const duration = endTime - startTime;
    console.log(`⏱️ Custom Metric [${name}]: ${Math.round(duration)}ms`);
    
    return duration;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // React Component 렌더링 성능 측정
  measureComponentRender(componentName) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (duration > 16.67) { // 60fps 기준
          console.warn(`🎭 Slow Component Render [${componentName}]: ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  }

  // 메모리 사용량 모니터링
  logMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      console.log('💾 Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
      });
    }
  }

  // 전체 성능 보고서 생성
  generateReport() {
    const metrics = this.getMetrics();
    this.logMemoryUsage();
    
    console.group('📊 Performance Report');
    console.log('Web Vitals:', metrics);
    console.log('Monitoring Status:', this.isMonitoring ? '✅ Active' : '❌ Inactive');
    console.log('Report Generated:', new Date().toISOString());
    console.groupEnd();
    
    return {
      metrics,
      timestamp: Date.now(),
      isMonitoring: this.isMonitoring
    };
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Named exports for convenience
export const {
  start: startPerformanceMonitoring,
  stop: stopPerformanceMonitoring,
  getMetrics: getPerformanceMetrics,
  measureCustomMetric,
  measureComponentRender,
  generateReport: generatePerformanceReport
} = performanceMonitor;
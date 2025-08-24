/**
 * 성능 모니터링 및 최적화 유틸리티
 */

// 디바운스 함수 - 빈번한 함수 호출 방지
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// 쓰로틀 함수 - 일정 시간 간격으로 함수 실행 제한
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// 메모이제이션 함수 - 결과 캐싱으로 성능 최적화
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = getKey(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// 성능 측정 데코레이터
export const measurePerformance = (name, fn) => {
  return (...args) => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    
    if (endTime - startTime > 16) { // 16ms 이상 걸리면 로그
      console.warn(`[Performance] ${name}: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  };
};

// 배열 처리 성능 최적화 함수들
export const optimizedArrayOperations = {
  // 큰 배열을 청크로 나누어 처리
  chunkProcess: (array, chunkSize, processFunc) => {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      results.push(...processFunc(chunk));
    }
    return results;
  },

  // 조건에 맞는 첫 번째 요소 찾기 (조기 종료)
  findFirst: (array, predicate) => {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i], i)) {
        return array[i];
      }
    }
    return undefined;
  },

  // 효율적인 배열 중복 제거
  removeDuplicates: (array, keyExtractor = item => item) => {
    const seen = new Set();
    return array.filter(item => {
      const key = keyExtractor(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
};
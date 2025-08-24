import { useState, useEffect } from 'react';

/**
 * 모바일 디바이스 감지를 위한 최적화된 커스텀 훅
 * - Throttled resize handling으로 성능 최적화
 * - SSR 안전성 보장
 * - 메모리 누수 방지를 위한 적절한 cleanup
 */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Lazy initialization으로 초기 렌더링 성능 최적화
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint;
    }
    return false; // SSR에서는 모바일이 아닌 것으로 기본값 설정
  });

  useEffect(() => {
    let timeoutId;
    
    const checkMobile = () => {
      const newIsMobile = window.innerWidth <= breakpoint;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
      }
    };

    // Throttled resize handler로 성능 최적화 (100ms 디바운스)
    const throttledResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    // Passive 이벤트 리스너로 성능 향상
    window.addEventListener('resize', throttledResize, { passive: true });

    return () => {
      window.removeEventListener('resize', throttledResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [breakpoint, isMobile]);

  return isMobile;
};

export default useIsMobile;
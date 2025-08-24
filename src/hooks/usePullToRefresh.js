import { useState, useEffect, useCallback } from 'react';

const usePullToRefresh = (onRefresh, threshold = 100) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 터치 시작 위치
  const [startY, setStartY] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleTouchStart = useCallback((e) => {
    if (!isEnabled || window.scrollY > 0) return;
    
    const touch = e.touches[0];
    setStartY(touch.clientY);
  }, [isEnabled]);

  const handleTouchMove = useCallback((e) => {
    if (!isEnabled || window.scrollY > 0 || isRefreshing) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - startY;
    
    // 아래로 스와이프할 때만 (deltaY > 0)
    if (deltaY > 0 && window.scrollY === 0) {
      e.preventDefault(); // 기본 스크롤 방지
      
      const distance = Math.min(deltaY * 0.5, threshold * 1.5); // 저항감 추가
      setPullDistance(distance);
      setIsPulling(distance > 20); // 20px 이상부터 pulling 상태
    }
  }, [startY, threshold, isEnabled, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isEnabled || isRefreshing) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('새로고침 실패:', error);
      } finally {
        // 새로고침 완료 후 애니메이션
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsPulling(false);
        }, 500);
      }
    } else {
      // 임계값에 도달하지 못한 경우 원위치
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [pullDistance, threshold, onRefresh, isEnabled, isRefreshing]);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, isEnabled]);

  // 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsEnabled(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    isEnabled
  };
};

export default usePullToRefresh;
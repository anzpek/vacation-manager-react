import { useRef } from 'react';

export const useSwipe = (handlers, options = {}) => {
  const {
    minSwipeDistance = 50,
    preventDefaultTouchmoveEvent = false
  } = options;

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const touchEndY = useRef(null);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    console.log('[useSwipe] 터치 시작:', {
      x: touchStartX.current,
      y: touchStartY.current,
      target: e.target.className
    });
  };

  const onTouchMove = (e) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    console.log('[useSwipe] 터치 이동:', {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const onTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) {
      console.log('[useSwipe] 터치 시작 좌표 없음');
      return;
    }

    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    console.log('[useSwipe] 터치 종료:', {
      startX: touchStartX.current,
      endX: touchEndX.current,
      distanceX,
      distanceY,
      isHorizontal: isHorizontalSwipe,
      minDistance: minSwipeDistance,
      willTrigger: isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance
    });

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        // 왼쪽으로 스와이프 (다음으로 이동)
        console.log('[useSwipe] ✅ 왼쪽 스와이프 감지됨');
        handlers.onSwipeLeft?.();
      } else {
        // 오른쪽으로 스와이프 (이전으로 이동)
        console.log('[useSwipe] ✅ 오른쪽 스와이프 감지됨');
        handlers.onSwipeRight?.();
      }
    } else {
      console.log('[useSwipe] ❌ 스와이프 조건 미충족');
    }

    // 터치 포인트 리셋
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
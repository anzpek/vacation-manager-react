import { test, expect } from '@playwright/test';

test.describe('휴가 바 겹침 문제 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 애플리케이션으로 이동
    await page.goto('http://localhost:3000');
    
    // 로그인 페이지 로드 대기
    await page.waitForSelector('#departmentName', { timeout: 10000 });
    
    // 로그인 (테스트부서)
    await page.fill('#departmentName', '테스트부서');
    await page.fill('#password', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기 (대시보드 화면)
    await page.waitForSelector('.calendar-day', { timeout: 10000 });
    
    // 현재 화면이 이미 2025년 7월이므로 별도 조작 불필요
    await page.waitForTimeout(2000);
  });

  test('휴가 바 겹침 현상 재현 및 확인', async ({ page }) => {
    console.log('🧪 테스트 시작: 현재 상태 분석');
    
    // 현재 상태 스크린샷 촬영
    await page.screenshot({ path: 'test-current-state.png', fullPage: true });
    
    console.log('✅ 현재 상태 캡처 완료');
    
    // 각 날짜의 휴가 바 위치 분석
    const day7Bars = await page.locator('.calendar-day:has([class*="calendar-day"]) >> text="7"').locator('..').locator('.vacation-bar').all();
    const day8Bars = await page.locator('.calendar-day:has([class*="calendar-day"]) >> text="8"').locator('..').locator('.vacation-bar').all();
    const day9Bars = await page.locator('.calendar-day:has([class*="calendar-day"]) >> text="9"').locator('..').locator('.vacation-bar').all();
    const day10Bars = await page.locator('.calendar-day:has([class*="calendar-day"]) >> text="10"').locator('..').locator('.vacation-bar').all();
    
    console.log(`📊 일괄 입력 후 - 7일: ${day7Bars.length}개, 8일: ${day8Bars.length}개, 9일: ${day9Bars.length}개, 10일: ${day10Bars.length}개`);
    
    // 8일의 겹침 상황 확인 (연두 연차와 태구 연차가 모두 있는 날)
    if (day8Bars.length >= 2) {
      console.log('🔍 8일 휴가 바 위치 분석:');
      for (let i = 0; i < day8Bars.length; i++) {
        const topValue = await day8Bars[i].evaluate(el => window.getComputedStyle(el).top || el.style.top);
        const barText = await day8Bars[i].textContent();
        console.log(`📍 8일 휴가 바 ${i}: top=${topValue}, 내용="${barText}"`);
      }
      
      // 겹침 여부 확인
      const positions = [];
      for (let i = 0; i < day8Bars.length; i++) {
        const rect = await day8Bars[i].boundingBox();
        if (rect) {
          positions.push({ index: i, top: rect.y, text: await day8Bars[i].textContent() });
        }
      }
      
      console.log('📊 8일 휴가 바들의 실제 위치:', positions);
      
      // 겹침 검사
      let hasOverlap = false;
      for (let i = 0; i < positions.length - 1; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const diff = Math.abs(positions[i].top - positions[j].top);
          if (diff < 20) { // 20px 이하 차이면 겹침으로 판단
            console.log(`❌ 겹침 발견! 바 ${i}와 바 ${j} (차이: ${diff}px)`);
            hasOverlap = true;
          }
        }
      }
      
      if (!hasOverlap) {
        console.log('✅ 겹침 없음 - 문제 해결됨!');
      } else {
        console.log('❌ 여전히 겹침 존재 - 추가 수정 필요');
      }
    }
    
    console.log('🔍 겹침 분석 완료');
  });
});
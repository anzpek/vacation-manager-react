const { chromium } = require('playwright');

async function testOverlapFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting overlap fix test...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    console.log('🔐 Logging in to 경기보상3팀...');
    
    // Select department
    await page.selectOption('select', '경기보상3팀');
    await page.waitForTimeout(500);
    
    // Enter password
    await page.fill('input[type="password"]', '1234');
    await page.waitForTimeout(500);
    
    // Click login
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    console.log('📅 Navigating to July 2025...');
    
    // Navigate to July 2025
    await page.selectOption('select[value="2025"]', '2025');
    await page.waitForTimeout(500);
    await page.selectOption('select[value="6"]', '6'); // July is index 6
    await page.waitForTimeout(2000);
    
    console.log('🔍 Checking vacation bars on day 8...');
    
    // Find day 8 cell
    const day8Cell = await page.locator('div').filter({ hasText: /^8$/ }).first();
    await day8Cell.waitFor();
    
    // Check vacation bars in day 8
    const vacationBars = await day8Cell.locator('.vacation-bar, [style*="background"]').all();
    console.log(`📊 Found ${vacationBars.length} vacation bars on day 8`);
    
    // Get positions of vacation bars
    const barPositions = [];
    for (let i = 0; i < vacationBars.length; i++) {
      const bar = vacationBars[i];
      const boundingBox = await bar.boundingBox();
      const text = await bar.textContent();
      const style = await bar.getAttribute('style');
      
      barPositions.push({
        index: i,
        top: boundingBox?.y || 0,
        text: text?.trim() || '',
        style: style || '',
        height: boundingBox?.height || 0
      });
    }
    
    // Sort by vertical position
    barPositions.sort((a, b) => a.top - b.top);
    
    console.log('📍 Vacation bar positions on day 8:');
    barPositions.forEach((bar, idx) => {
      console.log(`  ${idx + 1}. Y:${bar.top} "${bar.text}" (height:${bar.height})`);
    });
    
    // Check for overlaps
    let hasOverlap = false;
    for (let i = 0; i < barPositions.length - 1; i++) {
      const current = barPositions[i];
      const next = barPositions[i + 1];
      
      const currentBottom = current.top + current.height;
      const nextTop = next.top;
      
      if (currentBottom > nextTop + 2) { // 2px tolerance
        console.log(`❌ OVERLAP DETECTED: Bar "${current.text}" (bottom:${currentBottom}) overlaps with "${next.text}" (top:${nextTop})`);
        hasOverlap = true;
      }
    }
    
    if (!hasOverlap) {
      console.log('✅ NO OVERLAPS DETECTED - Fix successful!');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-result.png', fullPage: true });
    console.log('📸 Screenshot saved as test-result.png');
    
    // Check specific bars for 연두 and 태구
    const yeonduBar = barPositions.find(bar => bar.text.includes('연두') || bar.style.includes('blue'));
    const taeguBar = barPositions.find(bar => bar.text.includes('태구') || bar.style.includes('green'));
    
    if (yeonduBar && taeguBar) {
      console.log(`👤 연두 bar position: Y:${yeonduBar.top}`);
      console.log(`👤 태구 bar position: Y:${taeguBar.top}`);
      
      if (yeonduBar.top < taeguBar.top) {
        console.log('✅ Correct ordering: 연두 above 태구');
      } else {
        console.log('❌ Wrong ordering: 태구 above 연두');
      }
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testOverlapFix();
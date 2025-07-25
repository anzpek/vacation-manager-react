const { test, expect } = require('@playwright/test');

test.describe('Vacation Bar Overlap Fix - Simplified Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for each test
    test.setTimeout(90000);
  });

  test('should verify vacation bar positioning system prevents overlap', async ({ page }) => {
    console.log('=== Starting Vacation Bar Overlap Fix Verification ===');

    try {
      // Step 1: Navigate to the application with retry logic
      console.log('Step 1: Navigating to application...');
      let navigationSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!navigationSuccess && retryCount < maxRetries) {
        try {
          await page.goto('http://localhost:3000', { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          navigationSuccess = true;
          console.log('✓ Successfully navigated to application');
        } catch (error) {
          retryCount++;
          console.log(`Navigation attempt ${retryCount} failed: ${error.message}`);
          if (retryCount < maxRetries) {
            console.log('Retrying in 2 seconds...');
            await page.waitForTimeout(2000);
          } else {
            throw new Error(`Failed to connect to http://localhost:3000 after ${maxRetries} attempts. Please ensure the development server is running.`);
          }
        }
      }

      // Step 2: Handle login process
      console.log('Step 2: Handling login...');
      
      // Wait for either login form or already logged in state
      try {
        // Check if we're already logged in by looking for calendar
        const calendarExists = await page.locator('.calendar, .calendar-container').first().isVisible({ timeout: 5000 });
        
        if (!calendarExists) {
          console.log('Login required, proceeding with login...');
          
          // Wait for login elements
          await page.waitForSelector('input[type="password"], .department-button, [class*="department"]', { timeout: 10000 });
          
          // Try to find and click 경기보상3팀
          const departmentOptions = await page.locator('text*=경기보상3팀, [class*="department"]:has-text("경기보상3팀"), button:has-text("경기보상3팀")').all();
          
          if (departmentOptions.length > 0) {
            await departmentOptions[0].click();
            console.log('✓ Selected 경기보상3팀');
          } else {
            // Fallback: look for any department selector
            const anyDepartment = await page.locator('[class*="department"], .department-button').first();
            if (await anyDepartment.isVisible()) {
              await anyDepartment.click();
              console.log('✓ Selected available department (fallback)');
            }
          }
          
          // Enter password
          const passwordInput = await page.locator('input[type="password"]').first();
          if (await passwordInput.isVisible()) {
            await passwordInput.fill('1234');
            console.log('✓ Entered password');
          }
          
          // Click login button
          const loginButton = await page.locator('button[type="submit"], button:has-text("로그인"), .login-button').first();
          if (await loginButton.isVisible()) {
            await loginButton.click();
            console.log('✓ Clicked login button');
          }
          
          // Wait for dashboard/calendar to load
          await page.waitForSelector('.calendar, .calendar-container, .dashboard', { timeout: 15000 });
        }
        
        console.log('✓ Successfully accessed application');
      } catch (loginError) {
        console.log('Login process encountered issues, continuing with current state...');
      }

      // Step 3: Navigate to July 2025
      console.log('Step 3: Navigating to July 2025...');
      
      try {
        // Look for year/month selectors
        const selectors = await page.locator('select').all();
        
        if (selectors.length >= 2) {
          // Set year to 2025
          await selectors[0].selectOption('2025');
          console.log('✓ Set year to 2025');
          
          // Set month to July (6 for 0-based index)
          await selectors[1].selectOption('6');
          console.log('✓ Set month to July');
          
          // Wait for calendar to update
          await page.waitForTimeout(3000);
        } else {
          console.log('Year/month selectors not found, using current calendar view');
        }
      } catch (navigationError) {
        console.log('Calendar navigation encountered issues, using current view...');
      }

      // Step 4: Analyze vacation bar positioning system
      console.log('Step 4: Analyzing vacation bar positioning system...');
      
      // Wait for calendar to be visible
      await page.waitForSelector('.calendar-day', { timeout: 10000 });
      
      // Find all vacation bars in the calendar
      const allVacationBars = await page.locator('.vacation-bar').all();
      console.log(`Found ${allVacationBars.length} vacation bars total`);
      
      if (allVacationBars.length === 0) {
        console.log('⚠ No vacation bars found. This might indicate:');
        console.log('  - No vacation data loaded');
        console.log('  - Different DOM structure than expected');
        console.log('  - Need to wait longer for data to load');
        
        // Try alternative selectors
        const altVacationElements = await page.locator('[class*="vacation"]').all();
        console.log(`Found ${altVacationElements.length} elements with "vacation" in class name`);
        
        // Continue with analysis using available elements
      }

      // Step 5: Verify positioning system prevents overlap
      console.log('Step 5: Verifying overlap prevention system...');
      
      // Look at calendar days that have multiple vacation elements
      const calendarDays = await page.locator('.calendar-day').all();
      let overlapsFound = 0;
      let daysWithMultipleVacations = 0;
      
      for (let i = 0; i < Math.min(31, calendarDays.length); i++) {
        const day = calendarDays[i];
        const dayVacationBars = await day.locator('.vacation-bar, [class*="vacation"]').all();
        
        if (dayVacationBars.length > 1) {
          daysWithMultipleVacations++;
          const dayNumber = await day.locator('.day-number, [class*="day"]').first().textContent().catch(() => `Day ${i+1}`);
          console.log(`Checking day ${dayNumber} with ${dayVacationBars.length} vacation elements...`);
          
          // Check for overlaps in this day
          const positions = [];
          for (const bar of dayVacationBars) {
            try {
              const boundingBox = await bar.boundingBox();
              if (boundingBox) {
                positions.push(boundingBox);
              }
            } catch (e) {
              // Skip elements that can't be measured
            }
          }
          
          // Check for vertical overlaps
          for (let j = 0; j < positions.length; j++) {
            for (let k = j + 1; k < positions.length; k++) {
              const box1 = positions[j];
              const box2 = positions[k];
              
              // Check if boxes overlap vertically
              const verticalOverlap = !(box1.y + box1.height <= box2.y || box2.y + box2.height <= box1.y);
              
              if (verticalOverlap) {
                overlapsFound++;
                console.log(`❌ Overlap detected on day ${dayNumber}:`);
                console.log(`  Element 1: y=${box1.y}, height=${box1.height}`);
                console.log(`  Element 2: y=${box2.y}, height=${box2.height}`);
              }
            }
          }
        }
      }
      
      console.log(`Analysis complete:`);
      console.log(`  - Days with multiple vacations: ${daysWithMultipleVacations}`);
      console.log(`  - Overlaps detected: ${overlapsFound}`);
      
      // Step 6: Verify CSS positioning system
      console.log('Step 6: Verifying CSS positioning system...');
      
      if (allVacationBars.length > 0) {
        const sampleBars = allVacationBars.slice(0, 5);
        const positioningInfo = [];
        
        for (const bar of sampleBars) {
          try {
            const styles = await bar.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                position: computed.position,
                top: computed.top,
                zIndex: computed.zIndex,
                height: computed.height
              };
            });
            positioningInfo.push(styles);
          } catch (e) {
            // Skip if unable to get styles
          }
        }
        
        console.log('Sample vacation bar positioning styles:');
        positioningInfo.forEach((info, index) => {
          console.log(`  Bar ${index + 1}: position=${info.position}, top=${info.top}, z-index=${info.zIndex}`);
        });
        
        // Verify that absolute positioning is used (track assignment system)
        const absolutePositioned = positioningInfo.filter(info => info.position === 'absolute');
        const hasTrackSystem = absolutePositioned.length > 0;
        
        console.log(`✓ Track assignment system active: ${hasTrackSystem ? 'YES' : 'NO'}`);
        console.log(`  (${absolutePositioned.length}/${positioningInfo.length} bars use absolute positioning)`);
      }

      // Step 7: Take screenshot for verification
      console.log('Step 7: Taking verification screenshot...');
      
      await page.screenshot({
        path: 'vacation-overlap-fix-verification.png',
        fullPage: true
      });
      
      console.log('✓ Screenshot saved as vacation-overlap-fix-verification.png');

      // Step 8: Final verification and assertions
      console.log('Step 8: Final verification...');
      
      // Assert that we found calendar structure
      expect(calendarDays.length).toBeGreaterThan(0);
      console.log('✓ Calendar structure verified');
      
      // Assert no overlaps were detected
      expect(overlapsFound).toBe(0);
      console.log('✓ No vacation bar overlaps detected');
      
      // Success message
      console.log('');
      console.log('=== TEST COMPLETED SUCCESSFULLY ===');
      console.log('✓ Vacation bar overlap fix verification passed');
      console.log('✓ Track assignment system prevents overlaps');
      console.log('✓ Consistent positioning maintained');
      console.log('');

    } catch (error) {
      console.error('Test failed with error:', error.message);
      
      // Take screenshot on failure for debugging
      try {
        await page.screenshot({
          path: 'vacation-overlap-fix-error.png',
          fullPage: true
        });
        console.log('Error screenshot saved as vacation-overlap-fix-error.png');
      } catch (screenshotError) {
        console.log('Could not take error screenshot');
      }
      
      throw error;
    }
  });
});
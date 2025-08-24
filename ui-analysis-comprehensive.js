// UI Analysis Comprehensive Test
// This test captures screenshots and analyzes the entire UI of the vacation management system

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

test.describe('UI Comprehensive Analysis', () => {
  test.beforeAll(async () => {
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, 'ui-analysis-screenshots');
    try {
      await fs.access(screenshotsDir);
    } catch {
      await fs.mkdir(screenshotsDir, { recursive: true });
    }
  });

  test('Analyze Complete UI Flow', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      analysis: {},
      screenshots: [],
      recommendations: []
    };

    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
      // Step 1: Login Screen Analysis
      console.log('🔍 Analyzing Login Screen...');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loginScreenshot = 'ui-analysis-screenshots/01-login-screen.png';
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      report.screenshots.push(loginScreenshot);

      // Check if login form is visible
      const loginElements = await page.evaluate(() => {
        const form = document.querySelector('form');
        const inputs = document.querySelectorAll('input');
        const buttons = document.querySelectorAll('button');
        const themeToggle = document.querySelector('[class*="theme"]');
        
        return {
          hasForm: !!form,
          inputCount: inputs.length,
          buttonCount: buttons.length,
          hasThemeToggle: !!themeToggle,
          title: document.title,
          bodyClasses: document.body.className
        };
      });

      report.analysis.loginScreen = {
        elements: loginElements,
        accessibility: await page.evaluate(() => {
          const form = document.querySelector('form');
          const inputs = document.querySelectorAll('input');
          const labels = document.querySelectorAll('label');
          
          return {
            hasProperLabels: inputs.length === labels.length,
            hasAriaAttributes: Array.from(inputs).some(input => input.hasAttribute('aria-label')),
            hasFormValidation: !!form?.noValidate === false
          };
        }),
        performance: {
          loadTime: await page.evaluate(() => performance.now())
        }
      };

      // Step 2: Attempt to login and analyze main dashboard
      console.log('🔍 Attempting to analyze main application...');
      
      // Try to login with provided credentials
      try {
        // Fill department name
        const departmentInput = page.locator('input[type="text"]').first();
        await departmentInput.fill('보상지원부');
        
        // Fill password
        const passwordInput = page.locator('input[type="password"]');
        await passwordInput.fill('1343');
        
        // Click submit button
        await page.locator('button[type="submit"]').click();
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        // Check if we're in the main app
        const isLoggedIn = await page.locator('.dashboard, .calendar, .header, [class*="header"], [class*="dashboard"], [class*="calendar"]').count() > 0;
        
        if (isLoggedIn) {
          // Step 3: Main Dashboard Analysis
          console.log('✅ Successfully logged in, analyzing dashboard...');
          const dashboardScreenshot = 'ui-analysis-screenshots/02-dashboard.png';
          await page.screenshot({ path: dashboardScreenshot, fullPage: true });
          report.screenshots.push(dashboardScreenshot);

          // Analyze dashboard components
          report.analysis.dashboard = await page.evaluate(() => {
            const header = document.querySelector('.header, [class*="header"]');
            const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
            const calendar = document.querySelector('.calendar, [class*="calendar"]');
            const filters = document.querySelector('.filter, [class*="filter"]');
            
            return {
              hasHeader: !!header,
              hasSidebar: !!sidebar,
              hasCalendar: !!calendar,
              hasFilters: !!filters,
              layout: {
                isResponsive: window.getComputedStyle(document.body).display === 'flex',
                headerHeight: header ? header.offsetHeight : 0,
                sidebarWidth: sidebar ? sidebar.offsetWidth : 0
              }
            };
          });

          // Step 4: Test responsive design
          console.log('📱 Testing mobile responsiveness...');
          await page.setViewportSize({ width: 375, height: 667 });
          await page.waitForTimeout(500);
          
          const mobileScreenshot = 'ui-analysis-screenshots/03-mobile-view.png';
          await page.screenshot({ path: mobileScreenshot, fullPage: true });
          report.screenshots.push(mobileScreenshot);

          report.analysis.mobile = await page.evaluate(() => {
            const isMobileLayout = window.innerWidth < 768;
            const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
            const calendar = document.querySelector('.calendar, [class*="calendar"]');
            
            return {
              isMobileViewport: isMobileLayout,
              sidebarHidden: sidebar ? getComputedStyle(sidebar).display === 'none' : false,
              calendarResponsive: calendar ? calendar.scrollWidth <= window.innerWidth : true,
              hasHamburgerMenu: !!document.querySelector('.hamburger, [class*="mobile-menu"]')
            };
          });

          // Step 5: Test calendar functionality
          console.log('📅 Testing calendar functionality...');
          await page.setViewportSize({ width: 1920, height: 1080 });
          await page.waitForTimeout(500);

          // Try to interact with calendar
          const calendarCells = await page.locator('.calendar-day, [class*="day"], .day').count();
          if (calendarCells > 0) {
            // Click on a calendar day
            await page.locator('.calendar-day, [class*="day"], .day').first().click();
            await page.waitForTimeout(1000);
            
            const calendarInteractionScreenshot = 'ui-analysis-screenshots/04-calendar-interaction.png';
            await page.screenshot({ path: calendarInteractionScreenshot, fullPage: true });
            report.screenshots.push(calendarInteractionScreenshot);

            report.analysis.calendar = {
              hasDays: calendarCells > 0,
              isInteractive: true,
              dayCount: calendarCells
            };
          }

          // Step 6: Test modals and popups
          console.log('🔲 Testing modals and popups...');
          const modals = await page.locator('.modal, [class*="modal"]').count();
          if (modals > 0) {
            const modalScreenshot = 'ui-analysis-screenshots/05-modal-interaction.png';
            await page.screenshot({ path: modalScreenshot, fullPage: true });
            report.screenshots.push(modalScreenshot);
          }

          // Step 7: Test theme switching
          console.log('🎨 Testing theme functionality...');
          const themeToggle = page.locator('.header-theme-button');
          if (await themeToggle.count() > 0) {
            await themeToggle.click();
            await page.waitForTimeout(500);
            
            const darkThemeScreenshot = 'ui-analysis-screenshots/06-dark-theme.png';
            await page.screenshot({ path: darkThemeScreenshot, fullPage: true });
            report.screenshots.push(darkThemeScreenshot);

            report.analysis.theming = {
              hasThemeToggle: true,
              themeChanged: await page.evaluate(() => {
                return document.body.className.includes('dark') || 
                       document.documentElement.className.includes('dark');
              })
            };
          }
        } else {
          console.log('❌ Could not login, analyzing login issues...');
          report.analysis.loginIssues = {
            couldNotLogin: true,
            currentUrl: page.url(),
            errorMessages: await page.locator('.error, [class*="error"]').allTextContents()
          };
        }
      } catch (loginError) {
        console.log('❌ Login attempt failed:', loginError.message);
        report.analysis.loginError = {
          error: loginError.message,
          currentUrl: page.url()
        };
      }

      // Step 8: Accessibility Analysis
      console.log('♿ Running accessibility analysis...');
      report.analysis.accessibility = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        const buttons = document.querySelectorAll('button');
        const links = document.querySelectorAll('a');
        const inputs = document.querySelectorAll('input');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        return {
          imagesWithoutAlt: Array.from(images).filter(img => !img.alt).length,
          buttonsWithoutLabel: Array.from(buttons).filter(btn => !btn.textContent && !btn.getAttribute('aria-label')).length,
          linksWithoutText: Array.from(links).filter(link => !link.textContent && !link.getAttribute('aria-label')).length,
          inputsWithoutLabels: Array.from(inputs).filter(input => {
            const id = input.id;
            return !id || !document.querySelector(`label[for="${id}"]`);
          }).length,
          headingStructure: Array.from(headings).map(h => h.tagName.toLowerCase()),
          hasSkipLink: !!document.querySelector('a[href="#main"], .skip-link')
        };
      });

      // Step 9: Performance Analysis
      console.log('⚡ Analyzing performance...');
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paintEntries = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });

      report.analysis.performance = performanceMetrics;

    } catch (error) {
      console.error('Error during UI analysis:', error);
      report.analysis.errors = [error.message];
    }

    // Generate recommendations based on analysis
    const recommendations = generateRecommendations(report.analysis);
    report.recommendations = recommendations;

    // Save analysis report
    await fs.writeFile(
      'ui-analysis-report.json', 
      JSON.stringify(report, null, 2)
    );

    console.log('📊 Analysis complete! Report saved to ui-analysis-report.json');
    console.log(`📸 ${report.screenshots.length} screenshots captured`);
    console.log(`💡 ${report.recommendations.length} recommendations generated`);
  });
});

function generateRecommendations(analysis) {
  const recommendations = [];

  // Accessibility recommendations
  if (analysis.accessibility) {
    if (analysis.accessibility.imagesWithoutAlt > 0) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'High',
        issue: `${analysis.accessibility.imagesWithoutAlt} images missing alt text`,
        solution: 'Add descriptive alt attributes to all images'
      });
    }

    if (analysis.accessibility.inputsWithoutLabels > 0) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'High',
        issue: `${analysis.accessibility.inputsWithoutLabels} inputs missing labels`,
        solution: 'Add proper labels or aria-label attributes to all inputs'
      });
    }

    if (!analysis.accessibility.hasSkipLink) {
      recommendations.push({
        category: 'Accessibility',
        priority: 'Medium',
        issue: 'No skip navigation link found',
        solution: 'Add skip link for keyboard navigation users'
      });
    }
  }

  // Performance recommendations
  if (analysis.performance) {
    if (analysis.performance.firstContentfulPaint > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: `First Contentful Paint is ${analysis.performance.firstContentfulPaint}ms (should be < 2000ms)`,
        solution: 'Optimize initial rendering, consider code splitting and lazy loading'
      });
    }

    if (analysis.performance.resourceCount > 100) {
      recommendations.push({
        category: 'Performance',
        priority: 'Medium',
        issue: `Too many resources loaded: ${analysis.performance.resourceCount}`,
        solution: 'Bundle resources, use CDN, implement resource optimization'
      });
    }
  }

  // Mobile responsiveness
  if (analysis.mobile && !analysis.mobile.calendarResponsive) {
    recommendations.push({
      category: 'Responsive Design',
      priority: 'High',
      issue: 'Calendar not properly responsive on mobile',
      solution: 'Implement responsive calendar design with horizontal scrolling or stacked layout'
    });
  }

  // Login issues
  if (analysis.loginIssues?.couldNotLogin) {
    recommendations.push({
      category: 'User Experience',
      priority: 'Critical',
      issue: 'Login functionality not working properly',
      solution: 'Fix authentication flow and provide better error messages'
    });
  }

  return recommendations;
}
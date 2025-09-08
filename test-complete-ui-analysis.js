const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 스크린샷 저장 폴더 생성
const screenshotDir = 'ui-analysis-screenshots';
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
}

async function comprehensiveUIAnalysis() {
    const browser = await chromium.launch({ headless: false });
    
    // 데스크톱과 모바일 컨텍스트 생성
    const desktopContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        hasTouch: true,
        isMobile: true
    });

    const issues = [];
    
    try {
        console.log('🖥️  데스크톱 UI 분석 시작...');
        await analyzeDesktopUI(desktopContext, issues);
        
        console.log('📱 모바일 UI 분석 시작...');
        await analyzeMobileUI(mobileContext, issues);
        
        console.log('📊 분석 결과 정리...');
        await generateReport(issues);
        
    } catch (error) {
        console.error('❌ 분석 중 오류:', error);
        issues.push({
            type: 'critical_error',
            description: `분석 중 치명적 오류 발생: ${error.message}`,
            severity: 'critical'
        });
    } finally {
        await desktopContext.close();
        await mobileContext.close();
        await browser.close();
    }
}

async function analyzeDesktopUI(context, issues) {
    const page = await context.newPage();
    
    // 콘솔 오류 감지
    page.on('console', msg => {
        if (msg.type() === 'error') {
            issues.push({
                type: 'console_error',
                description: `콘솔 오류: ${msg.text()}`,
                severity: 'medium',
                platform: 'desktop'
            });
        }
    });
    
    try {
        console.log('1️⃣ 로그인 페이지 분석...');
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        // 로그인 페이지 스크린샷
        await page.screenshot({ 
            path: `${screenshotDir}/01-desktop-login.png`, 
            fullPage: true 
        });
        
        // 로그인 폼 검증
        const loginForm = await page.$('input[placeholder*="부서명"]');
        if (!loginForm) {
            issues.push({
                type: 'missing_element',
                description: '로그인 폼이 없습니다',
                severity: 'critical',
                platform: 'desktop'
            });
            return;
        }
        
        console.log('2️⃣ 로그인 프로세스...');
        await page.fill('input[placeholder*="부서명"]', '보상지원부');
        await page.fill('input[type="password"]', '1343');
        await page.click('button:has-text("로그인")');
        await page.waitForTimeout(3000);
        
        console.log('3️⃣ 메인 대시보드 분석...');
        await page.screenshot({ 
            path: `${screenshotDir}/02-desktop-dashboard.png`, 
            fullPage: true 
        });
        
        // 헤더 검증
        await analyzeHeader(page, issues, 'desktop');
        
        // 달력 검증
        await analyzeCalendar(page, issues, 'desktop');
        
        // 사이드바 검증
        await analyzeSidebar(page, issues, 'desktop');
        
        console.log('4️⃣ 모든 모달 테스트...');
        await testAllModals(page, issues, 'desktop');
        
        console.log('5️⃣ 직원 관리 테스트...');
        await testEmployeeManagement(page, issues, 'desktop');
        
        console.log('6️⃣ 필터 기능 테스트...');
        await testFilterFunctionality(page, issues, 'desktop');
        
        console.log('7️⃣ 테마 전환 테스트...');
        await testThemeToggle(page, issues, 'desktop');
        
    } catch (error) {
        issues.push({
            type: 'desktop_analysis_error',
            description: `데스크톱 분석 오류: ${error.message}`,
            severity: 'high',
            platform: 'desktop'
        });
    }
    
    await page.close();
}

async function analyzeMobileUI(context, issues) {
    const page = await context.newPage();
    
    // 콘솔 오류 감지
    page.on('console', msg => {
        if (msg.type() === 'error') {
            issues.push({
                type: 'console_error',
                description: `모바일 콘솔 오류: ${msg.text()}`,
                severity: 'medium',
                platform: 'mobile'
            });
        }
    });
    
    try {
        console.log('📱 1️⃣ 모바일 로그인 페이지...');
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
            path: `${screenshotDir}/03-mobile-login.png`, 
            fullPage: true 
        });
        
        // 터치 인터랙션 테스트
        await testTouchInteractions(page, issues);
        
        console.log('📱 2️⃣ 모바일 로그인...');
        await page.tap('input[placeholder*="부서명"]');
        await page.fill('input[placeholder*="부서명"]', '보상지원부');
        await page.tap('input[type="password"]');
        await page.fill('input[type="password"]', '1343');
        await page.tap('button:has-text("로그인")');
        await page.waitForTimeout(3000);
        
        console.log('📱 3️⃣ 모바일 대시보드...');
        await page.screenshot({ 
            path: `${screenshotDir}/04-mobile-dashboard.png`, 
            fullPage: true 
        });
        
        // 모바일 전용 기능 테스트
        await testMobileSpecificFeatures(page, issues);
        
        // 모바일 달력 테스트
        await analyzeMobileCalendar(page, issues);
        
        // 모바일 모달 테스트
        await testMobileModals(page, issues);
        
        // 모바일 네비게이션 테스트
        await testMobileNavigation(page, issues);
        
        console.log('📱 4️⃣ Pull to Refresh 테스트...');
        await testPullToRefresh(page, issues);
        
        console.log('📱 5️⃣ 스와이프 제스처 테스트...');
        await testSwipeGestures(page, issues);
        
    } catch (error) {
        issues.push({
            type: 'mobile_analysis_error',
            description: `모바일 분석 오류: ${error.message}`,
            severity: 'high',
            platform: 'mobile'
        });
    }
    
    await page.close();
}

async function analyzeHeader(page, issues, platform) {
    try {
        // 헤더 존재 확인
        const header = await page.$('header, [data-testid="header"], .header');
        if (!header) {
            issues.push({
                type: 'missing_header',
                description: '헤더가 없습니다',
                severity: 'high',
                platform
            });
            return;
        }
        
        // 로고/제목 확인
        const title = await page.$('h1, .title, .logo');
        if (!title) {
            issues.push({
                type: 'missing_title',
                description: '헤더에 제목/로고가 없습니다',
                severity: 'medium',
                platform
            });
        }
        
        // 네비게이션 버튼들 확인
        const navButtons = await page.$$('button, .nav-item');
        if (navButtons.length === 0) {
            issues.push({
                type: 'missing_navigation',
                description: '네비게이션 버튼이 없습니다',
                severity: 'medium',
                platform
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'header_analysis_error',
            description: `헤더 분석 오류: ${error.message}`,
            severity: 'medium',
            platform
        });
    }
}

async function analyzeCalendar(page, issues, platform) {
    try {
        // 달력 요소 확인
        const calendar = await page.$('.calendar, [data-testid="calendar"]');
        if (!calendar) {
            issues.push({
                type: 'missing_calendar',
                description: '달력이 표시되지 않습니다',
                severity: 'critical',
                platform
            });
            return;
        }
        
        // 달력 날짜 셀들 확인
        const calendarDays = await page.$$('.calendar-day, .day, [data-testid="calendar-day"]');
        if (calendarDays.length === 0) {
            issues.push({
                type: 'empty_calendar',
                description: '달력에 날짜가 표시되지 않습니다',
                severity: 'high',
                platform
            });
        }
        
        // 월 네비게이션 확인
        const prevButton = await page.$('button:has-text("이전"), button:has-text("<"), .prev-month');
        const nextButton = await page.$('button:has-text("다음"), button:has-text(">"), .next-month');
        
        if (!prevButton || !nextButton) {
            issues.push({
                type: 'missing_month_navigation',
                description: '월 네비게이션 버튼이 없습니다',
                severity: 'medium',
                platform
            });
        }
        
        // 휴가 데이터 표시 확인
        const vacationBars = await page.$$('.vacation-bar, .vacation-item, [data-vacation]');
        console.log(`${platform} - 휴가 바 개수: ${vacationBars.length}`);
        
    } catch (error) {
        issues.push({
            type: 'calendar_analysis_error',
            description: `달력 분석 오류: ${error.message}`,
            severity: 'medium',
            platform
        });
    }
}

async function analyzeSidebar(page, issues, platform) {
    try {
        // 사이드바 또는 필터 영역 확인
        const sidebar = await page.$('.sidebar, .filter-section, [data-testid="sidebar"]');
        if (!sidebar) {
            issues.push({
                type: 'missing_sidebar',
                description: '사이드바/필터 영역이 없습니다',
                severity: 'low',
                platform
            });
            return;
        }
        
        // 직원 필터 확인
        const employeeFilters = await page.$$('.employee-filter, .filter-item, [data-testid="employee-filter"]');
        if (employeeFilters.length === 0) {
            issues.push({
                type: 'missing_filters',
                description: '직원 필터가 없습니다',
                severity: 'medium',
                platform
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'sidebar_analysis_error',
            description: `사이드바 분석 오류: ${error.message}`,
            severity: 'low',
            platform
        });
    }
}

async function testAllModals(page, issues, platform) {
    const modalTests = [
        { trigger: 'button:has-text("직원 관리")', name: '직원 관리' },
        { trigger: 'button:has-text("직원 추가")', name: '직원 추가' },
        { trigger: 'button:has-text("설정")', name: '설정' },
        { trigger: 'button:has-text("관리자")', name: '관리자' }
    ];
    
    for (const modal of modalTests) {
        try {
            const trigger = await page.$(modal.trigger);
            if (trigger) {
                console.log(`   ${modal.name} 모달 테스트...`);
                await trigger.click();
                await page.waitForTimeout(1000);
                
                // 모달 표시 확인
                const modalElement = await page.$('.modal, [role="dialog"], .modal-content');
                if (modalElement) {
                    await page.screenshot({ 
                        path: `${screenshotDir}/modal-${platform}-${modal.name.replace(/\s/g, '-')}.png` 
                    });
                    
                    // 모달 닫기 테스트
                    const closeButton = await page.$('.modal-close, button:has-text("닫기"), button:has-text("×")');
                    if (closeButton) {
                        await closeButton.click();
                        await page.waitForTimeout(500);
                    } else {
                        // ESC로 닫기 시도
                        await page.keyboard.press('Escape');
                        await page.waitForTimeout(500);
                    }
                } else {
                    issues.push({
                        type: 'modal_not_opening',
                        description: `${modal.name} 모달이 열리지 않습니다`,
                        severity: 'medium',
                        platform
                    });
                }
            }
        } catch (error) {
            issues.push({
                type: 'modal_test_error',
                description: `${modal.name} 모달 테스트 오류: ${error.message}`,
                severity: 'medium',
                platform
            });
        }
    }
}

async function testEmployeeManagement(page, issues, platform) {
    try {
        // 직원 관리 버튼 찾기 및 클릭
        const employeeBtn = await page.$('button:has-text("직원 관리"), button:has-text("직원"), .employee-manage');
        if (employeeBtn) {
            await employeeBtn.click();
            await page.waitForTimeout(1000);
            
            // 직원 목록 확인
            const employeeList = await page.$$('.employee-item, .employee-card, [data-testid="employee"]');
            console.log(`   ${platform} - 직원 수: ${employeeList.length}`);
            
            await page.screenshot({ 
                path: `${screenshotDir}/employee-management-${platform}.png` 
            });
            
            // 직원 추가 테스트
            const addBtn = await page.$('button:has-text("추가"), button:has-text("직원 추가")');
            if (addBtn) {
                await addBtn.click();
                await page.waitForTimeout(1000);
                
                // 추가 폼 확인
                const nameInput = await page.$('input[placeholder*="이름"], input[name="name"]');
                const teamInput = await page.$('input[placeholder*="팀"], input[name="team"], select[name="team"]');
                
                if (!nameInput || !teamInput) {
                    issues.push({
                        type: 'incomplete_employee_form',
                        description: '직원 추가 폼이 완전하지 않습니다',
                        severity: 'medium',
                        platform
                    });
                }
                
                // 폼 닫기
                const cancelBtn = await page.$('button:has-text("취소"), button:has-text("닫기")');
                if (cancelBtn) {
                    await cancelBtn.click();
                }
            }
        }
    } catch (error) {
        issues.push({
            type: 'employee_management_error',
            description: `직원 관리 테스트 오류: ${error.message}`,
            severity: 'medium',
            platform
        });
    }
}

async function testFilterFunctionality(page, issues, platform) {
    try {
        // 필터 버튼들 찾기
        const filterButtons = await page.$$('button[class*="filter"], .filter-btn, [data-testid*="filter"]');
        
        for (let i = 0; i < Math.min(filterButtons.length, 3); i++) {
            try {
                await filterButtons[i].click();
                await page.waitForTimeout(500);
                
                // 필터 적용 후 달력 변화 확인
                const visibleVacations = await page.$$('.vacation-bar:not([style*="display: none"])');
                console.log(`   필터 ${i+1} 적용 후 휴가 개수: ${visibleVacations.length}`);
                
            } catch (error) {
                // 개별 필터 오류는 기록하지만 전체 테스트는 계속
                console.log(`   필터 ${i+1} 클릭 오류: ${error.message}`);
            }
        }
        
        await page.screenshot({ 
            path: `${screenshotDir}/filters-applied-${platform}.png` 
        });
        
    } catch (error) {
        issues.push({
            type: 'filter_test_error',
            description: `필터 테스트 오류: ${error.message}`,
            severity: 'low',
            platform
        });
    }
}

async function testThemeToggle(page, issues, platform) {
    try {
        // 테마 토글 버튼 찾기
        const themeBtn = await page.$('button[class*="theme"], .theme-toggle, [data-testid="theme-toggle"]');
        if (themeBtn) {
            // 현재 테마 확인
            const bodyClass = await page.getAttribute('body', 'class') || '';
            
            await themeBtn.click();
            await page.waitForTimeout(1000);
            
            // 테마 변경 확인
            const newBodyClass = await page.getAttribute('body', 'class') || '';
            
            if (bodyClass === newBodyClass) {
                issues.push({
                    type: 'theme_not_changing',
                    description: '테마 토글이 작동하지 않습니다',
                    severity: 'low',
                    platform
                });
            } else {
                await page.screenshot({ 
                    path: `${screenshotDir}/theme-toggled-${platform}.png` 
                });
            }
        } else {
            issues.push({
                type: 'missing_theme_toggle',
                description: '테마 토글 버튼을 찾을 수 없습니다',
                severity: 'low',
                platform
            });
        }
    } catch (error) {
        issues.push({
            type: 'theme_test_error',
            description: `테마 테스트 오류: ${error.message}`,
            severity: 'low',
            platform
        });
    }
}

async function testTouchInteractions(page, issues) {
    try {
        // 터치 이벤트가 제대로 동작하는지 확인
        const touchableElements = await page.$$('button, input, [role="button"]');
        
        if (touchableElements.length > 0) {
            // 첫 번째 터치 가능한 요소 테스트
            await touchableElements[0].tap();
            await page.waitForTimeout(300);
            
            // 터치 피드백 또는 상태 변화 확인
            // (구체적인 구현에 따라 달라짐)
        }
        
    } catch (error) {
        issues.push({
            type: 'touch_interaction_error',
            description: `터치 인터랙션 테스트 오류: ${error.message}`,
            severity: 'medium',
            platform: 'mobile'
        });
    }
}

async function testMobileSpecificFeatures(page, issues) {
    try {
        // 모바일에서만 나타나는 기능들 테스트
        
        // 햄버거 메뉴 확인
        const hamburger = await page.$('.hamburger, .mobile-menu, button[aria-label*="menu"]');
        if (hamburger) {
            await hamburger.tap();
            await page.waitForTimeout(500);
            
            await page.screenshot({ 
                path: `${screenshotDir}/mobile-menu-open.png` 
            });
            
            // 메뉴 닫기
            const closeMenu = await page.$('.menu-close, .backdrop');
            if (closeMenu) {
                await closeMenu.tap();
            }
        }
        
        // 모바일 전용 버튼들 확인
        const mobileButtons = await page.$$('.mobile-only, .d-md-none');
        console.log(`   모바일 전용 버튼 개수: ${mobileButtons.length}`);
        
    } catch (error) {
        issues.push({
            type: 'mobile_features_error',
            description: `모바일 기능 테스트 오류: ${error.message}`,
            severity: 'medium',
            platform: 'mobile'
        });
    }
}

async function analyzeMobileCalendar(page, issues) {
    try {
        // 모바일 달력 레이아웃 확인
        const calendar = await page.$('.calendar, [data-testid="calendar"]');
        if (calendar) {
            const boundingBox = await calendar.boundingBox();
            
            // 화면 너비에 맞는지 확인
            if (boundingBox && boundingBox.width > 375) {
                issues.push({
                    type: 'mobile_calendar_overflow',
                    description: '모바일 달력이 화면을 벗어납니다',
                    severity: 'high',
                    platform: 'mobile'
                });
            }
        }
        
        // 모바일 달력 스크린샷
        await page.screenshot({ 
            path: `${screenshotDir}/mobile-calendar-detailed.png` 
        });
        
    } catch (error) {
        issues.push({
            type: 'mobile_calendar_error',
            description: `모바일 달력 분석 오류: ${error.message}`,
            severity: 'medium',
            platform: 'mobile'
        });
    }
}

async function testMobileModals(page, issues) {
    try {
        // 모바일에서 모달 동작 테스트
        const modalTriggers = await page.$$('button:has-text("추가"), button:has-text("관리")');
        
        for (let i = 0; i < Math.min(modalTriggers.length, 2); i++) {
            try {
                await modalTriggers[i].tap();
                await page.waitForTimeout(1000);
                
                const modal = await page.$('.modal, [role="dialog"]');
                if (modal) {
                    const boundingBox = await modal.boundingBox();
                    
                    // 모달이 화면에 맞는지 확인
                    if (boundingBox && (boundingBox.width > 375 || boundingBox.height > 667)) {
                        issues.push({
                            type: 'modal_mobile_overflow',
                            description: `모바일 모달 ${i+1}이 화면을 벗어납니다`,
                            severity: 'high',
                            platform: 'mobile'
                        });
                    }
                    
                    await page.screenshot({ 
                        path: `${screenshotDir}/mobile-modal-${i+1}.png` 
                    });
                    
                    // 모달 닫기
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                }
            } catch (error) {
                // 개별 모달 오류는 기록만 하고 계속
                console.log(`   모바일 모달 ${i+1} 테스트 오류: ${error.message}`);
            }
        }
        
    } catch (error) {
        issues.push({
            type: 'mobile_modal_error',
            description: `모바일 모달 테스트 오류: ${error.message}`,
            severity: 'medium',
            platform: 'mobile'
        });
    }
}

async function testMobileNavigation(page, issues) {
    try {
        // 모바일 네비게이션 테스트
        await page.tap('.calendar');
        await page.waitForTimeout(500);
        
        // 스크롤 테스트
        await page.evaluate(() => window.scrollTo(0, 100));
        await page.waitForTimeout(300);
        
        await page.screenshot({ 
            path: `${screenshotDir}/mobile-scrolled.png` 
        });
        
    } catch (error) {
        issues.push({
            type: 'mobile_navigation_error',
            description: `모바일 네비게이션 테스트 오류: ${error.message}`,
            severity: 'low',
            platform: 'mobile'
        });
    }
}

async function testPullToRefresh(page, issues) {
    try {
        // Pull to Refresh 기능 테스트
        await page.touchscreen.tap(200, 100);
        
        // 위에서 아래로 드래그 (Pull to Refresh 시뮬레이션)
        await page.touchscreen.tap(200, 50);
        await page.waitForTimeout(100);
        
        for (let i = 0; i < 5; i++) {
            await page.touchscreen.tap(200, 50 + (i * 20));
            await page.waitForTimeout(50);
        }
        
        await page.waitForTimeout(1000);
        
        // Pull to Refresh 애니메이션이나 표시 확인
        const refreshIndicator = await page.$('.pull-refresh, .refreshing, [data-testid="refresh"]');
        if (refreshIndicator) {
            await page.screenshot({ 
                path: `${screenshotDir}/mobile-pull-refresh.png` 
            });
        }
        
    } catch (error) {
        issues.push({
            type: 'pull_refresh_error',
            description: `Pull to Refresh 테스트 오류: ${error.message}`,
            severity: 'low',
            platform: 'mobile'
        });
    }
}

async function testSwipeGestures(page, issues) {
    try {
        // 좌우 스와이프 제스처 테스트 (달력 월 변경)
        const calendar = await page.$('.calendar');
        if (calendar) {
            const boundingBox = await calendar.boundingBox();
            if (boundingBox) {
                const centerY = boundingBox.y + boundingBox.height / 2;
                
                // 왼쪽으로 스와이프 (다음 달)
                await page.touchscreen.tap(boundingBox.x + boundingBox.width - 50, centerY);
                await page.waitForTimeout(100);
                
                for (let i = 0; i < 10; i++) {
                    await page.touchscreen.tap(boundingBox.x + boundingBox.width - 50 - (i * 10), centerY);
                    await page.waitForTimeout(20);
                }
                
                await page.waitForTimeout(1000);
                await page.screenshot({ 
                    path: `${screenshotDir}/mobile-after-swipe.png` 
                });
            }
        }
        
    } catch (error) {
        issues.push({
            type: 'swipe_gesture_error',
            description: `스와이프 제스처 테스트 오류: ${error.message}`,
            severity: 'low',
            platform: 'mobile'
        });
    }
}

async function generateReport(issues) {
    const report = {
        timestamp: new Date().toISOString(),
        totalIssues: issues.length,
        issuesBySeverity: {
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length
        },
        issuesByPlatform: {
            desktop: issues.filter(i => i.platform === 'desktop').length,
            mobile: issues.filter(i => i.platform === 'mobile').length,
            both: issues.filter(i => !i.platform).length
        },
        issues: issues
    };
    
    // 리포트 파일 저장
    fs.writeFileSync('ui-analysis-report.json', JSON.stringify(report, null, 2));
    
    // 콘솔에 요약 출력
    console.log('\n📋 UI 분석 리포트');
    console.log('='.repeat(50));
    console.log(`전체 이슈: ${report.totalIssues}개`);
    console.log(`심각도별:`);
    console.log(`  Critical: ${report.issuesBySeverity.critical}개`);
    console.log(`  High: ${report.issuesBySeverity.high}개`);
    console.log(`  Medium: ${report.issuesBySeverity.medium}개`);
    console.log(`  Low: ${report.issuesBySeverity.low}개`);
    console.log(`플랫폼별:`);
    console.log(`  Desktop: ${report.issuesByPlatform.desktop}개`);
    console.log(`  Mobile: ${report.issuesByPlatform.mobile}개`);
    
    if (issues.length > 0) {
        console.log('\n🔍 주요 이슈들:');
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
            if (issue.platform) {
                console.log(`   플랫폼: ${issue.platform}`);
            }
        });
    } else {
        console.log('\n✅ 이슈가 발견되지 않았습니다!');
    }
    
    console.log(`\n📷 스크린샷이 ${screenshotDir} 폴더에 저장되었습니다.`);
    console.log(`📄 상세 리포트가 ui-analysis-report.json에 저장되었습니다.`);
}

// 분석 실행
comprehensiveUIAnalysis().then(() => {
    console.log('✅ 전체 UI 분석 완료!');
    process.exit(0);
}).catch(error => {
    console.error('❌ 분석 실행 오류:', error);
    process.exit(1);
});
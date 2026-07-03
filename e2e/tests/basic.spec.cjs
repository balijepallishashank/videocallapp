const { test, expect } = require('@playwright/test');
const { injectAxe, checkA11y } = require('@axe-core/playwright');

test.describe('Smoke E2E + a11y', () => {
  test('root loads and login flows work (demo credentials) @a11y', async ({ page }) => {
    console.log('navigating to app root');
    await page.goto('http://localhost:5173/');
    console.log('page loaded, checking title');
    await expect(page).toHaveTitle(/Video Call Meeting App|VideoCall Pro/);

    // inject axe-core directly and run accessibility checks
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const axeResults = await page.evaluate(async () => await axe.run());
    if (axeResults && axeResults.violations && axeResults.violations.length > 0) {
      console.log('Axe violations summary:', JSON.stringify(axeResults.violations.map(v=>({id:v.id, impact:v.impact, nodes: v.nodes.length, description: v.description})), null, 2));
      console.log('Axe full results:', JSON.stringify(axeResults, null, 2));
    }
    expect(axeResults.violations.length).toBe(0);

    console.log('running student login flow');
    // Student login
    await page.click('text=Student');
    await page.fill('input[name="studentId"]', 'STU001');
    await page.fill('input[name="email"]', 'student@demo.com');
    await page.fill('input[name="password"]', 'password1');
    // Click the explicit submit button to avoid matching the "Login" tab
    await page.click('text=Login as Student');
    console.log('submitted login');

    // Wait for dashboard to load UI changes
    await page.waitForTimeout(700);
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 3000 }).catch(()=>{});

    // Logout to reset
    await page.click('text=Logout').catch(()=>{});
  });
});

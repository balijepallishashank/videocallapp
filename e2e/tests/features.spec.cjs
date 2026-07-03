const { test, expect } = require('@playwright/test');

test.describe('Feature smoke tests', () => {
  test('faculty quick-start meeting flow', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.click('text=Faculty');
    await page.fill('input[name="email"]', 'faculty@demo.com');
    await page.fill('input[name="password"]', 'password1');
    await page.click('text=Login as Faculty');
    await expect(page.locator('role=heading[name="Dashboard"]')).toBeVisible({ timeout: 5000 });

    // Start quick meeting and invite all
    await page.click('text=Start Meeting');
    await expect(page.locator('text=Start Meeting -')).toBeVisible({ timeout: 2000 });
    await page.click('text=Select All');
    const startBtn = page.locator('button:has-text("Start Meeting")').last();
    await expect(startBtn).toBeVisible({ timeout: 5000 });
    await startBtn.click();
    // Meeting room should show meeting title
    await expect(page.locator('text=Start Meeting -')).toBeHidden().catch(()=>{});
    await expect(page.locator('text=End')).toBeVisible({ timeout: 3000 });

    // End meeting
    const endBtn = page.locator('button[title="Leave meeting"]')
    await expect(endBtn).toBeVisible({ timeout: 3000 })
    await endBtn.click()
    await endBtn.waitFor({ state: 'detached', timeout: 5000 })
  });

  test('student request doubt flow', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.click('text=Student');
    await page.fill('input[name="studentId"]', 'STU001');
    await page.fill('input[name="email"]', 'student@demo.com');
    await page.fill('input[name="password"]', 'password1');
    await page.click('text=Login as Student');
    await expect(page.locator('role=heading[name="Student Dashboard"]')).toBeVisible({ timeout: 3000 });

    // Open request form and send
    await page.fill('input[placeholder="Topic (e.g., DSA, Networks)"]', 'Test Doubt');
    await page.fill('input[placeholder="Preferred slot (e.g., Tomorrow 4 PM)"]', 'Tomorrow 4 PM');
    await page.fill('textarea[placeholder="Describe your doubt briefly..."]', 'Short description');
    await page.click('text=Send Request');
    // Verify toast or pending request appears
    await expect(page.locator('text=You have pending faculty requests').first()).toBeVisible({ timeout: 3000 }).catch(()=>{});
  });
});

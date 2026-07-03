# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\tests\features.spec.cjs >> Feature smoke tests >> student request doubt flow
- Location: e2e\tests\features.spec.cjs:30:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('role=heading[name="Student Dashboard"]')
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('role=heading[name="Student Dashboard"]')

```

```yaml
- main "Login":
  - img
  - heading "VideoCall Pro" [level=1]
  - paragraph: University video meetings & academic management
  - button "Login"
  - button "Sign Up"
  - text: Continue As
  - button "Faculty"
  - button "Student"
  - text: "Firebase: Error (auth/invalid-credential). Student ID"
  - textbox "Student ID":
    - /placeholder: e.g., STU20250123
    - text: STU001
  - text: Email Address
  - img
  - textbox "your@email.com": student@demo.com
  - text: Password
  - img
  - textbox "••••••••": password1
  - button "Show password":
    - img
  - checkbox "Remember me"
  - text: Remember me
  - link "Forgot password?":
    - /url: "#"
  - button "Login as Student"
  - paragraph:
    - text: Don't have an account?
    - button "Sign up"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Feature smoke tests', () => {
  4  |   test('faculty quick-start meeting flow', async ({ page }) => {
  5  |     await page.goto('http://localhost:5173/');
  6  |     await page.click('text=Faculty');
  7  |     await page.fill('input[name="email"]', 'faculty@demo.com');
  8  |     await page.fill('input[name="password"]', 'password1');
  9  |     await page.click('text=Login as Faculty');
  10 |     await expect(page.locator('role=heading[name="Dashboard"]')).toBeVisible({ timeout: 5000 });
  11 | 
  12 |     // Start quick meeting and invite all
  13 |     await page.click('text=Start Meeting');
  14 |     await expect(page.locator('text=Start Meeting -')).toBeVisible({ timeout: 2000 });
  15 |     await page.click('text=Select All');
  16 |     const startBtn = page.locator('button:has-text("Start Meeting")').last();
  17 |     await expect(startBtn).toBeVisible({ timeout: 5000 });
  18 |     await startBtn.click();
  19 |     // Meeting room should show meeting title
  20 |     await expect(page.locator('text=Start Meeting -')).toBeHidden().catch(()=>{});
  21 |     await expect(page.locator('text=End')).toBeVisible({ timeout: 3000 });
  22 | 
  23 |     // End meeting
  24 |     const endBtn = page.locator('button[title="Leave meeting"]')
  25 |     await expect(endBtn).toBeVisible({ timeout: 3000 })
  26 |     await endBtn.click()
  27 |     await endBtn.waitFor({ state: 'detached', timeout: 5000 })
  28 |   });
  29 | 
  30 |   test('student request doubt flow', async ({ page }) => {
  31 |     await page.goto('http://localhost:5173/');
  32 |     await page.click('text=Student');
  33 |     await page.fill('input[name="studentId"]', 'STU001');
  34 |     await page.fill('input[name="email"]', 'student@demo.com');
  35 |     await page.fill('input[name="password"]', 'password1');
  36 |     await page.click('text=Login as Student');
> 37 |     await expect(page.locator('role=heading[name="Student Dashboard"]')).toBeVisible({ timeout: 3000 });
     |                                                                          ^ Error: expect(locator).toBeVisible() failed
  38 | 
  39 |     // Open request form and send
  40 |     await page.fill('input[placeholder="Topic (e.g., DSA, Networks)"]', 'Test Doubt');
  41 |     await page.fill('input[placeholder="Preferred slot (e.g., Tomorrow 4 PM)"]', 'Tomorrow 4 PM');
  42 |     await page.fill('textarea[placeholder="Describe your doubt briefly..."]', 'Short description');
  43 |     await page.click('text=Send Request');
  44 |     // Verify toast or pending request appears
  45 |     await expect(page.locator('text=You have pending faculty requests').first()).toBeVisible({ timeout: 3000 }).catch(()=>{});
  46 |   });
  47 | });
  48 | 
```
import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

// Use a long timeout for the entire serial test suite
test.describe.serial('Complete E2E Application Flow - Video Pro', () => {
  let browser: Browser;
  let facultyContext: BrowserContext;
  let studentContext: BrowserContext;
  let facultyPage: Page;
  let studentPage: Page;

  const timestamp = Date.now();
  const FACULTY_EMAIL = `e2e.faculty.${timestamp}@videopro-test.com`;
  const STUDENT_EMAIL = `e2e.student.${timestamp}@videopro-test.com`;
  const PASSWORD = 'TestPassword123!';
  
  let classCode = '';
  let inviteLink = '';

  test.beforeAll(async () => {
    browser = await chromium.launch();
    facultyContext = await browser.newContext();
    studentContext = await browser.newContext();
    facultyPage = await facultyContext.newPage();
    studentPage = await studentContext.newPage();
  });

  test.afterAll(async () => {
    // Cleanup will be added later (e.g., deleting accounts/classes via UI or API)
    await browser.close();
  });

  test('Phase 1: Registration - Faculty and Student', async () => {
    // 1. Faculty Registration
    await facultyPage.goto('http://localhost:5173/login');
    await facultyPage.waitForLoadState('networkidle');
    await expect(facultyPage).toHaveTitle(/Video Pro/);

    // Switch to Register Mode
    await facultyPage.click('button:has-text("Register")');

    // Select Faculty role
    await facultyPage.click('button:has-text("Faculty")');

    await facultyPage.fill('input[type="email"]', FACULTY_EMAIL);
    await facultyPage.fill('input[placeholder="••••••••"]', PASSWORD);
    await facultyPage.fill('input[placeholder="Re-enter password"]', PASSWORD);
    
    // Faculty specific fields
    await facultyPage.fill('input[placeholder="Prof. Jane Smith"]', 'E2E Faculty');
    await facultyPage.fill('input[placeholder="FAC123"]', 'E2E-FAC-01');
    await facultyPage.fill('input[placeholder="Assistant Professor"]', 'E2E Tester');
    await facultyPage.fill('input[placeholder="Data Structures, DBMS"]', 'E2E Testing');

    // Submit
    await facultyPage.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(facultyPage).toHaveURL(/.*\/faculty\/dashboard/, { timeout: 15000 });
    const facultyWelcome = facultyPage.locator('h1', { hasText: 'Faculty Dashboard' });
    await expect(facultyWelcome).toBeVisible();

    // 2. Student Registration
    await studentPage.goto('http://localhost:5173/login');
    await studentPage.waitForLoadState('networkidle');
    
    // Switch to Register Mode
    await studentPage.click('button:has-text("Register")');

    // Select Student role
    await studentPage.click('button:has-text("Student")');

    await studentPage.fill('input[type="email"]', STUDENT_EMAIL);
    await studentPage.fill('input[placeholder="••••••••"]', PASSWORD);
    await studentPage.fill('input[placeholder="Re-enter password"]', PASSWORD);
    
    // Student specific fields
    await studentPage.fill('input[placeholder="John Doe"]', 'E2E Student');
    await studentPage.fill('input[placeholder="e.g. STU12345"]', 'E2E-STU-01');

    // Submit
    await studentPage.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(studentPage).toHaveURL(/.*\/student\/dashboard/, { timeout: 15000 });
    const studentWelcome = studentPage.locator('h1', { hasText: 'Student Dashboard' });
    await expect(studentWelcome).toBeVisible();
  });

  test('Phase 2: Class Creation & Discovery - Faculty', async () => {
    // Navigate to My Classes
    await facultyPage.click('a:has-text("My Classes")');
    await expect(facultyPage).toHaveURL(/.*\/faculty\/classes/);

    // Click Create Class button
    await facultyPage.click('button:has-text("Create class")');

    // Fill Modal
    await facultyPage.fill('input[placeholder="Software Engineering"]', 'E2E Test Class');
    await facultyPage.fill('input[placeholder="SE-401"]', 'E2E-101');
    await facultyPage.fill('textarea[placeholder*="Short description"]', 'This is an automated E2E test class.');

    // Submit Creation
    await facultyPage.click('button:has-text("Save class")');

    // Wait for the class card to appear
    const classCard = facultyPage.locator('div.group', { hasText: 'E2E Test Class' }).first();
    await expect(classCard).toBeVisible({ timeout: 10000 });

    // Extract Class Code
    const codeElement = classCard.locator('span.uppercase.tracking-wide');
    classCode = await codeElement.innerText();
    expect(classCode).toBeTruthy();

    console.log(`[Test Log] Created Class with Code: ${classCode}`);
  });

  test('Phase 3: Class Join - Student', async () => {
    // Ensure student is on their classes page
    await studentPage.click('a:has-text("My Classes")');
    await expect(studentPage).toHaveURL(/.*\/student\/classes/);

    // Click Join Class button
    await studentPage.click('button:has-text("Join class")');

    // Fill Modal with the classCode generated by Faculty
    await studentPage.fill('input[placeholder="VP-ABC-1234"]', classCode);

    // Submit using the button inside the form so we don't accidentally click the toggle button
    await studentPage.locator('form').locator('button:has-text("Join class")').click();

    // Wait for success toast or class card
    const classCard = studentPage.locator('div.group', { hasText: 'E2E Test Class' }).first();
    await expect(classCard).toBeVisible({ timeout: 10000 });
    
    // Open class workspace
    await classCard.locator('button:has-text("Open Class")').click();
    await expect(studentPage).toHaveURL(new RegExp('.*\\/student\\/class\\/.*'));
  });

  test('Phase 4: Live Session Real-time Integration', async () => {
    // 1. Faculty opens the class workspace
    await facultyPage.click('a:has-text("My Classes")');
    const facultyClassCard = facultyPage.locator('div.group', { hasText: 'E2E Test Class' }).first();
    await facultyClassCard.locator('button:has-text("Open Class")').click();
    
    // Faculty starts the live session
    const startLiveClassBtn = facultyPage.locator('button:has-text("Start live class")');
    await expect(startLiveClassBtn).toBeVisible({ timeout: 10000 });
    await startLiveClassBtn.click();
    
    // Wait for faculty to be in the call (we look for an End Call button or a video container)
    const endCallBtn = facultyPage.locator('button[title="Leave meeting"]');
    await expect(endCallBtn).toBeVisible({ timeout: 10000 });

    // 2. Student joins the live session
    // Ensure student is in the class workspace (they should already be, but let's be safe)
    await studentPage.click('a:has-text("My Classes")');
    const studentClassCard = studentPage.locator('div.group', { hasText: 'E2E Test Class' }).first();
    await studentClassCard.locator('button:has-text("Open Class")').click();

    // Student clicks Join Live Class
    const joinLiveClassBtn = studentPage.locator('button:has-text("Join Live Class")');
    await expect(joinLiveClassBtn).toBeVisible({ timeout: 10000 });
    await joinLiveClassBtn.click();

    // Wait for student to be in the call (End Call button or Leave)
    const leaveCallBtn = studentPage.locator('button[title="Leave meeting"]');
    await expect(leaveCallBtn).toBeVisible({ timeout: 10000 });

    console.log(`[Test Log] Both Faculty and Student successfully joined the live session!`);

    // 3. Faculty Ends the call
    await endCallBtn.click();
    
    // Wait for student to be kicked out (Live class button should disappear or something, or URL changes back to class)
    await expect(studentPage).toHaveURL(/.*\/student\/class\/.*/);
  });
});

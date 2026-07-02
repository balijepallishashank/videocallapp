# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\tests\features.spec.cjs >> Feature smoke tests >> faculty quick-start meeting flow
- Location: e2e\tests\features.spec.cjs:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=End')
Expected: visible
Error: strict mode violation: locator('text=End') resolved to 3 elements:
    1) <p class="text-sm font-medium text-amber-200">Pending</p> aka getByRole('paragraph').filter({ hasText: 'Pending' })
    2) <option value="Sent">Pending</option> aka getByRole('combobox')
    3) <span class="px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border-amber-500/30">Pending</span> aka locator('span').filter({ hasText: 'Pending' })

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('text=End')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - button "Toggle sidebar" [ref=e4] [cursor=pointer]: ☰
  - complementary [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - generic [ref=e10]: UV
        - generic [ref=e11]:
          - generic [ref=e12]: University Meet
          - generic [ref=e13]: Academic video meetings
      - navigation [ref=e14]:
        - button "Dashboard" [ref=e15] [cursor=pointer]:
          - img [ref=e17]
          - generic [ref=e22]: Dashboard
        - button "Academic Structure" [ref=e23] [cursor=pointer]:
          - img [ref=e25]
          - generic [ref=e28]: Academic Structure
        - button "Meetings" [ref=e29] [cursor=pointer]:
          - img [ref=e31]
          - generic [ref=e34]: Meetings
        - button "Recordings" [ref=e35] [cursor=pointer]:
          - img [ref=e37]
          - generic [ref=e42]: Recordings
        - button "Settings" [ref=e43] [cursor=pointer]:
          - img [ref=e45]
          - generic [ref=e48]: Settings
      - generic [ref=e49]: Dashboard
  - main "Main content" [ref=e50]:
    - generic [ref=e53]:
      - generic [ref=e54]:
        - generic [ref=e55]:
          - heading "Dashboard" [level=1] [ref=e56]
          - paragraph [ref=e57]: Manage your academic sections and host video meetings.
        - button "Start Meeting" [ref=e59] [cursor=pointer]
      - generic [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]: Meetings
          - generic [ref=e63]: "12"
        - generic [ref=e64]:
          - generic [ref=e65]: Recordings
          - generic [ref=e66]: "5"
        - generic [ref=e67]:
          - generic [ref=e68]: Academic Units
          - generic [ref=e69]: "3"
      - generic [ref=e70]:
        - button "Academic Structure Browse departments, academic years, and students." [ref=e71] [cursor=pointer]:
          - img [ref=e72]
          - heading "Academic Structure" [level=3] [ref=e75]
          - paragraph [ref=e76]: Browse departments, academic years, and students.
        - button "Meetings Start, join, and manage video meetings." [ref=e77] [cursor=pointer]:
          - img [ref=e78]
          - heading "Meetings" [level=3] [ref=e81]
          - paragraph [ref=e82]: Start, join, and manage video meetings.
        - button "Recordings Access recordings and meeting summaries." [ref=e83] [cursor=pointer]:
          - img [ref=e84]
          - heading "Recordings" [level=3] [ref=e89]
          - paragraph [ref=e90]: Access recordings and meeting summaries.
        - button "Schedule Schedule academic sessions and reminders." [ref=e91] [cursor=pointer]:
          - img [ref=e92]
          - heading "Schedule" [level=3] [ref=e94]
          - paragraph [ref=e95]: Schedule academic sessions and reminders.
      - generic [ref=e96]:
        - generic [ref=e98]:
          - generic [ref=e100]: Next Upcoming Session
          - generic [ref=e102]:
            - generic [ref=e103]:
              - paragraph [ref=e104]: Subject
              - paragraph [ref=e105]: Operating Systems
            - generic [ref=e106]:
              - paragraph [ref=e107]: Student
              - generic [ref=e108]:
                - generic [ref=e109]: P
                - text: Priya Sharma
            - generic [ref=e110]:
              - paragraph [ref=e111]: Time
              - paragraph [ref=e112]:
                - img [ref=e113]
                - text: Tomorrow 10:00 AM
            - generic [ref=e116]:
              - paragraph [ref=e117]: Meeting Type
              - paragraph [ref=e118]:
                - img [ref=e119]
                - text: Video Call
          - generic [ref=e122]:
            - button "Join Session" [ref=e123] [cursor=pointer]:
              - img [ref=e124]
              - text: Join Session
            - button "View Details" [ref=e127] [cursor=pointer]
        - generic [ref=e128]:
          - heading "Doubt Requests Overview" [level=3] [ref=e129]
          - generic [ref=e130]:
            - generic [ref=e131]:
              - generic [ref=e132]:
                - img [ref=e134]
                - generic [ref=e137]: "1"
              - paragraph [ref=e138]: Pending
            - generic [ref=e139]:
              - generic [ref=e140]:
                - img [ref=e142]
                - generic [ref=e145]: "1"
              - paragraph [ref=e146]: Accepted
            - generic [ref=e147]:
              - generic [ref=e148]:
                - img [ref=e150]
                - generic [ref=e155]: "1"
              - paragraph [ref=e156]: Rescheduled
            - generic [ref=e157]:
              - generic [ref=e158]:
                - img [ref=e160]
                - generic [ref=e164]: "1"
              - paragraph [ref=e165]: Completed
        - generic [ref=e166]:
          - generic [ref=e167]:
            - heading "Doubt Requests Admin" [level=3] [ref=e168]
            - generic [ref=e169]:
              - generic [ref=e170]:
                - img [ref=e171]
                - textbox "Search requests..." [ref=e174]
              - combobox [ref=e175] [cursor=pointer]:
                - option "All Requests" [selected]
                - option "Pending"
                - option "Accepted"
                - option "Rescheduled"
                - option "Completed"
          - generic [ref=e176]:
            - generic [ref=e177]:
              - generic [ref=e178]:
                - generic [ref=e179]: High Priority
                - generic [ref=e181]: Rescheduled
              - heading "DBMS Lab" [level=4] [ref=e182]
              - generic [ref=e183]:
                - generic [ref=e184]:
                  - img [ref=e186]
                  - generic [ref=e189]:
                    - paragraph [ref=e190]: Student
                    - paragraph [ref=e191]: Rahul Gupta
                - generic [ref=e192]:
                  - img [ref=e194]
                  - generic [ref=e197]:
                    - paragraph [ref=e198]: Requested Time
                    - paragraph [ref=e199]: Friday 2:00 PM
                - generic [ref=e200]:
                  - img [ref=e202]
                  - generic [ref=e205]:
                    - paragraph [ref=e206]: Faculty Assigned
                    - paragraph [ref=e207]: You
              - button "Details" [ref=e209] [cursor=pointer]
            - generic [ref=e210]:
              - generic [ref=e211]:
                - generic [ref=e212]: Medium Priority
                - generic [ref=e214]: Pending
              - heading "Data Structures" [level=4] [ref=e215]
              - generic [ref=e216]:
                - generic [ref=e217]:
                  - img [ref=e219]
                  - generic [ref=e222]:
                    - paragraph [ref=e223]: Student
                    - paragraph [ref=e224]: Aarav Patel
                - generic [ref=e225]:
                  - img [ref=e227]
                  - generic [ref=e230]:
                    - paragraph [ref=e231]: Requested Time
                    - paragraph [ref=e232]: Today 5:30 PM
                - generic [ref=e233]:
                  - img [ref=e235]
                  - generic [ref=e238]:
                    - paragraph [ref=e239]: Faculty Assigned
                    - paragraph [ref=e240]: You
              - generic [ref=e241]:
                - button "Accept" [ref=e242] [cursor=pointer]
                - button "Reschedule" [ref=e243] [cursor=pointer]
                - button "Details" [ref=e244] [cursor=pointer]
            - generic [ref=e245]:
              - generic [ref=e246]:
                - generic [ref=e247]: Medium Priority
                - generic [ref=e249]: Completed
              - heading "Computer Networks" [level=4] [ref=e250]
              - generic [ref=e251]:
                - generic [ref=e252]:
                  - img [ref=e254]
                  - generic [ref=e257]:
                    - paragraph [ref=e258]: Student
                    - paragraph [ref=e259]: Sneha Reddy
                - generic [ref=e260]:
                  - img [ref=e262]
                  - generic [ref=e265]:
                    - paragraph [ref=e266]: Requested Time
                    - paragraph [ref=e267]: Completed session
                - generic [ref=e268]:
                  - img [ref=e270]
                  - generic [ref=e273]:
                    - paragraph [ref=e274]: Faculty Assigned
                    - paragraph [ref=e275]: You
              - button "Details" [ref=e277] [cursor=pointer]
            - generic [ref=e278]:
              - generic [ref=e279]:
                - generic [ref=e280]: Low Priority
                - generic [ref=e282]: Accepted
              - heading "Operating Systems" [level=4] [ref=e283]
              - generic [ref=e284]:
                - generic [ref=e285]:
                  - img [ref=e287]
                  - generic [ref=e290]:
                    - paragraph [ref=e291]: Student
                    - paragraph [ref=e292]: Priya Sharma
                - generic [ref=e293]:
                  - img [ref=e295]
                  - generic [ref=e298]:
                    - paragraph [ref=e299]: Requested Time
                    - paragraph [ref=e300]: Tomorrow 10:00 AM
                - generic [ref=e301]:
                  - img [ref=e303]
                  - generic [ref=e306]:
                    - paragraph [ref=e307]: Faculty Assigned
                    - paragraph [ref=e308]: You
              - generic [ref=e309]:
                - button "Mark Complete" [ref=e310] [cursor=pointer]
                - button "Details" [ref=e311] [cursor=pointer]
        - generic [ref=e312]:
          - heading "Recent Activity" [level=3] [ref=e313]
          - generic [ref=e316]:
            - paragraph [ref=e318]: Meeting Started
            - paragraph [ref=e319]: CSE Section A (Semester 3) - Data Structures & Algorithms with 4 students.
            - paragraph [ref=e320]: Just now
  - generic [ref=e322]:
    - img [ref=e323]
    - paragraph [ref=e325]: Meeting started with 4 students from CSE Section A (Semester 3)
  - generic [ref=e326]:
    - button "Logout" [ref=e327] [cursor=pointer]
    - button "Notifications (1 unread)" [ref=e328] [cursor=pointer]:
      - img [ref=e329]
      - generic: "1"
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
> 21 |     await expect(page.locator('text=End')).toBeVisible({ timeout: 3000 });
     |                                            ^ Error: expect(locator).toBeVisible() failed
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
  37 |     await expect(page.locator('role=heading[name="Student Dashboard"]')).toBeVisible({ timeout: 3000 });
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
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basic.spec.cjs >> Smoke E2E + a11y >> root loads and login flows work (demo credentials) @a11y
- Location: e2e\tests\basic.spec.cjs:5:3

# Error details

```
Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- main "Login" [ref=e3]:
  - generic [ref=e7]:
    - generic [ref=e8]:
      - img [ref=e11]
      - heading "VideoCall Pro" [level=1] [ref=e13]
      - paragraph [ref=e14]: University video meetings & academic management
    - generic [ref=e15]:
      - generic [ref=e16]:
        - button "Login" [active] [ref=e17] [cursor=pointer]
        - button "Sign Up" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - generic [ref=e20]: Continue As
        - generic [ref=e21]:
          - button "Faculty" [ref=e22] [cursor=pointer]
          - button "Student" [ref=e23] [cursor=pointer]
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: Student ID
          - textbox "Student ID" [ref=e27]:
            - /placeholder: e.g., STU20250123
            - text: STU001
        - generic [ref=e28]:
          - generic [ref=e29]: Email Address
          - generic [ref=e30]:
            - img [ref=e31]
            - textbox "your@email.com" [ref=e34]: student@demo.com
        - generic [ref=e35]:
          - generic [ref=e36]: Password
          - generic [ref=e37]:
            - img [ref=e38]
            - textbox "••••••••" [ref=e41]: password1
            - button "Show password" [ref=e42] [cursor=pointer]:
              - img [ref=e43]
        - generic [ref=e46]:
          - generic [ref=e47] [cursor=pointer]:
            - checkbox "Remember me" [ref=e48]
            - generic [ref=e49]: Remember me
          - link "Forgot password?" [ref=e50] [cursor=pointer]:
            - /url: "#"
        - button "Login as Student" [ref=e51] [cursor=pointer]:
          - generic [ref=e52]: Login as Student
      - generic [ref=e53]:
        - paragraph [ref=e54]: "Demo Credentials:"
        - generic [ref=e55]:
          - paragraph [ref=e56]: "Faculty: faculty@demo.com / any 6+ char password"
          - paragraph [ref=e57]: "Student: STU001 + student@demo.com / any 6+ char password"
    - paragraph [ref=e58]:
      - text: Don't have an account?
      - button "Sign up" [ref=e59] [cursor=pointer]
```
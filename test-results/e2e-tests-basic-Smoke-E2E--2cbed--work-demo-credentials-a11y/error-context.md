# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\tests\basic.spec.cjs >> Smoke E2E + a11y >> root loads and login flows work (demo credentials) @a11y
- Location: e2e\tests\basic.spec.cjs:5:3

# Error details

```
Test timeout of 30000ms exceeded.
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
        - button "Login" [ref=e17] [cursor=pointer]
        - button "Sign Up" [ref=e18] [cursor=pointer]
      - generic [ref=e19]:
        - generic [ref=e20]: Continue As
        - generic [ref=e21]:
          - button "Faculty" [ref=e22] [cursor=pointer]
          - button "Student" [ref=e23] [cursor=pointer]
      - generic [ref=e24]:
        - generic [ref=e25]: "Firebase: Error (auth/invalid-credential)."
        - generic [ref=e26]:
          - generic [ref=e27]: Student ID
          - textbox "Student ID" [ref=e28]:
            - /placeholder: e.g., STU20250123
            - text: STU001
        - generic [ref=e29]:
          - generic [ref=e30]: Email Address
          - generic [ref=e31]:
            - img [ref=e32]
            - textbox "your@email.com" [ref=e35]: student@demo.com
        - generic [ref=e36]:
          - generic [ref=e37]: Password
          - generic [ref=e38]:
            - img [ref=e39]
            - textbox "••••••••" [ref=e42]: password1
            - button "Show password" [ref=e43] [cursor=pointer]:
              - img [ref=e44]
        - generic [ref=e47]:
          - generic [ref=e48] [cursor=pointer]:
            - checkbox "Remember me" [ref=e49]
            - generic [ref=e50]: Remember me
          - link "Forgot password?" [ref=e51] [cursor=pointer]:
            - /url: "#"
        - button "Login as Student" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]: Login as Student
    - paragraph [ref=e54]:
      - text: Don't have an account?
      - button "Sign up" [ref=e55] [cursor=pointer]
```
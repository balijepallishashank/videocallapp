const { test, expect } = require('@playwright/test');

test.describe('Authentication & Navigation', () => {
  test('User can access login page and verify UI elements', async ({ page }) => {
    // Navigate to local dev server (adjust port if necessary, defaulting to Vite 5173)
    await page.goto('http://localhost:5173/login');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Video Pro/);

    // Verify main headings or elements
    const loginHeading = page.locator('h1', { hasText: 'Welcome Back' });
    await expect(loginHeading).toBeVisible();

    // Verify email and password inputs exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Verify Sign in button exists
    const signInButton = page.locator('button', { hasText: 'Sign in' });
    await expect(signInButton).toBeVisible();
  });

  test('User can navigate to registration page', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    const signUpLink = page.locator('a', { hasText: 'Sign up' });
    await signUpLink.click();
    
    // URL should change
    await expect(page).toHaveURL(/.*\/register/);
    
    // Registration specific elements
    const createAccountHeading = page.locator('h1', { hasText: 'Create Account' });
    await expect(createAccountHeading).toBeVisible();
  });
});

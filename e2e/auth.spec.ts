import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('should display register page with all fields', async ({ page }) => {
    await page.goto('/register');
    
    // Core fields
    await expect(page.getByTestId('register-name')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password')).toBeVisible();
    await expect(page.getByTestId('register-submit')).toBeVisible();

    // Profile fields
    await expect(page.getByTestId('register-birthdate')).toBeVisible();
    await expect(page.getByTestId('register-gender')).toBeVisible();
    await expect(page.getByTestId('register-relationship-type')).toBeVisible();
    await expect(page.getByTestId('register-partner-name')).toBeVisible();
    await expect(page.getByTestId('register-has-children')).toBeAttached();
  });

  test('should fill all registration fields', async ({ page }) => {
    await page.goto('/register');

    // Fill all fields
    await page.getByTestId('register-name').fill('Test User');
    await page.getByTestId('register-birthdate').fill('1995-03-15');
    await page.getByTestId('register-gender').selectOption('female');
    await page.getByTestId('register-relationship-type').selectOption('dating');
    await page.getByTestId('register-partner-name').fill('Partner Name');
    await page.getByTestId('register-has-children').check({ force: true });
    await page.getByTestId('register-email').fill('test-fields@example.com');
    await page.getByTestId('register-password').fill('TestPassword123!');
    await page.getByTestId('register-confirm-password').fill('TestPassword123!');

    // Verify values
    await expect(page.getByTestId('register-name')).toHaveValue('Test User');
    await expect(page.getByTestId('register-birthdate')).toHaveValue('1995-03-15');
    await expect(page.getByTestId('register-gender')).toHaveValue('female');
    await expect(page.getByTestId('register-relationship-type')).toHaveValue('dating');
    await expect(page.getByTestId('register-partner-name')).toHaveValue('Partner Name');
    await expect(page.getByTestId('register-has-children')).toBeChecked();
    await expect(page.getByTestId('register-email')).toHaveValue('test-fields@example.com');
    // Don't submit — this test just verifies all fields are fillable
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // PR #17 moved ThemeToggle/LanguageSelector to ProfilePage.
    // The register link on login page shows "Register" (t('auth.register')), not "Sign up"
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/.*register/);
    
    // The login link on register page shows "Login" (t('auth.login')), not "Sign in"
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });
});

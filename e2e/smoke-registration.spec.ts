/**
 * Smoke test: Registration & Login
 *
 * Verifica que las páginas críticas cargan correctamente
 * y que los campos de formulario son interactivos.
 * NO crea usuarios reales — solo valida que la app está viva.
 *
 * Ejecutar:
 *   ./scripts/check-registration.sh                           # prod
 *   ./scripts/check-registration.sh https://lovecompass.co    # custom URL
 */

import { test, expect } from '@playwright/test';

// No auth needed for these tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Registration Smoke Test', () => {
  test('registration page loads with all form fields', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });

    // Core fields must be visible
    await expect(page.getByTestId('register-name')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password')).toBeVisible();
    await expect(page.getByTestId('register-submit')).toBeVisible();

    // Fields are interactive (can type into them)
    await page.getByTestId('register-name').fill('Smoke Test');
    await expect(page.getByTestId('register-name')).toHaveValue('Smoke Test');

    await page.getByTestId('register-email').fill('smoke@test.co');
    await expect(page.getByTestId('register-email')).toHaveValue('smoke@test.co');

    console.log('  ✅ Registration page loaded — all fields interactive');
  });

  test('login page loads with all form fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('login-email')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();

    // Fields are interactive
    await page.getByTestId('login-email').fill('test@test.co');
    await expect(page.getByTestId('login-email')).toHaveValue('test@test.co');

    console.log('  ✅ Login page loaded — all fields interactive');
  });

  test('navigation between login and register works', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('login-email')).toBeVisible({ timeout: 15000 });

    // Go to register
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByTestId('register-name')).toBeVisible({ timeout: 10000 });

    // Go back to login
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByTestId('login-email')).toBeVisible({ timeout: 10000 });

    console.log('  ✅ Navigation login ↔ register works');
  });

  test('password strength meter responds to input', async ({ page }) => {
    await page.goto('/register', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('register-password')).toBeVisible({ timeout: 15000 });

    // Type a weak password
    await page.getByTestId('register-password').fill('abc');
    await expect(page.getByTestId('password-strength-meter')).toBeVisible();

    // Type a strong password
    await page.getByTestId('register-password').fill('MyStr0ng!Pass#2026');
    await expect(page.getByTestId('strength-label')).toBeVisible();

    console.log('  ✅ Password strength meter is working');
  });
});

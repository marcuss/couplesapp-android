/**
 * E2E Nightly: Full Invitation Flow
 *
 * Tests the complete couple invitation flow:
 * 1. User A registers with all profile fields
 * 2. User A generates an invite code
 * 3. User B registers with all profile fields
 * 4. User B accepts the invitation using the code
 * 5. Both users are linked as a couple
 *
 * Uses throwaway emails to avoid state pollution between runs.
 */
import { test, expect, Page } from '@playwright/test';

// Each run gets unique emails to avoid collisions
const TS = Date.now();
const USER_A_EMAIL = `test-invite-a-${TS}@test.local`;
const USER_A_PASSWORD = 'TestInvA_2026!';
const USER_A_NAME = 'InviterAlice';

const USER_B_EMAIL = `test-invite-b-${TS}@test.local`;
const USER_B_PASSWORD = 'TestInvB_2026!';
const USER_B_NAME = 'InviteeBob';

// Skip auth storage state — these tests manage their own sessions
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Register a new user through the UI, filling all profile fields.
 */
async function registerUser(
  page: Page,
  opts: {
    name: string;
    email: string;
    password: string;
    dateOfBirth?: string;
    gender?: string;
    relationshipType?: string;
    partnerName?: string;
    hasChildren?: boolean;
  },
) {
  await page.goto('/register');
  await page.getByTestId('register-name').fill(opts.name);
  await page.getByTestId('register-email').fill(opts.email);
  await page.getByTestId('register-password').fill(opts.password);
  await page.getByTestId('register-confirm-password').fill(opts.password);

  // Optional profile fields
  if (opts.dateOfBirth) {
    await page.getByTestId('register-birthdate').fill(opts.dateOfBirth);
  }
  if (opts.gender) {
    await page.getByTestId('register-gender').selectOption(opts.gender);
  }
  if (opts.relationshipType) {
    await page.getByTestId('register-relationship-type').selectOption(opts.relationshipType);
  }
  if (opts.partnerName) {
    await page.getByTestId('register-partner-name').fill(opts.partnerName);
  }
  if (opts.hasChildren) {
    await page.getByTestId('register-has-children').check();
  }

  await page.getByTestId('register-submit').click();

  // Wait for successful registration — either dashboard or check-email message
  await expect(
    page.getByText(/dashboard|check.*email|welcome/i).first(),
  ).toBeVisible({ timeout: 15000 });
}

/**
 * Login an existing user.
 */
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

test.describe('Invitation Flow', () => {
  let inviteCode: string;

  test('User A registers with full profile', async ({ page }) => {
    await registerUser(page, {
      name: USER_A_NAME,
      email: USER_A_EMAIL,
      password: USER_A_PASSWORD,
      dateOfBirth: '1995-06-15',
      gender: 'female',
      relationshipType: 'dating',
      partnerName: USER_B_NAME,
      hasChildren: false,
    });
  });

  test('User A generates an invite code', async ({ page }) => {
    await loginUser(page, USER_A_EMAIL, USER_A_PASSWORD);

    // Navigate to invite page
    await page.goto('/invite');
    await expect(page.locator('[data-testid="invite-code-digits"]')).toBeVisible({
      timeout: 15000,
    });

    // Extract the 6-digit code from individual character divs
    const digitEls = page.locator('[data-testid="invite-code-digits"] > div');
    const digits = await digitEls.allTextContents();
    inviteCode = digits.join('').trim();
    expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
    console.log(`📋 Invite code: ${inviteCode}`);
  });

  test('User B registers with full profile', async ({ page }) => {
    await registerUser(page, {
      name: USER_B_NAME,
      email: USER_B_EMAIL,
      password: USER_B_PASSWORD,
      dateOfBirth: '1996-09-22',
      gender: 'male',
      relationshipType: 'dating',
      partnerName: USER_A_NAME,
      hasChildren: false,
    });
  });

  test('User B accepts invitation with code', async ({ page }) => {
    test.skip(!inviteCode, 'No invite code from previous test');

    await loginUser(page, USER_B_EMAIL, USER_B_PASSWORD);

    // Navigate to join page with the code
    await page.goto(`/join/${inviteCode}`);

    // Wait for connection success
    await expect(
      page.getByText(/connected|vinculad|you are now connected/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('User A sees partner connected', async ({ page }) => {
    test.skip(!inviteCode, 'No invite code from previous test');

    await loginUser(page, USER_A_EMAIL, USER_A_PASSWORD);

    // Dashboard should show partner connection
    await expect(
      page.getByText(new RegExp(USER_B_NAME, 'i')).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});

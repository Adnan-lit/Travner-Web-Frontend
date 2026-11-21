import { expect, test } from '@playwright/test';
import { mockApi, regularUser } from './mocks';

test.describe('authentication flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { authenticated: false });
  });

  test('anonymous visitors are sent to signin with a return URL', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signin\?returnUrl=%2Fdashboard/);
  });

  test('signin posts the entered credentials and opens the dashboard', async ({ page }) => {
    let loginBody: unknown;
    let loginMethod = '';
    await page.route('**/api/auth/login', async (route) => {
      loginBody = route.request().postDataJSON();
      loginMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { accessToken: 'e2e-access-token', tokenType: 'Bearer', expiresIn: 900, user: regularUser },
        }),
      });
    });

    await page.goto('/signin');
    await page.locator('#username').fill('Alice');
    await page.locator('#password').fill('correct-password');
    await page.locator('form.signin-form button[type=submit]').click();

    await expect(page).toHaveURL(/\/dashboard/);
    expect(loginMethod).toBe('POST');
    expect(loginBody).toEqual({ username: 'alice', password: 'correct-password' });
  });

  test('signup posts normalized data and redirects to signin', async ({ page }) => {
    let signupBody: unknown;
    let signupMethod = '';
    await page.route('**/api/public/register', async (route) => {
      signupBody = route.request().postDataJSON();
      signupMethod = route.request().method();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: regularUser }),
      });
    });

    await page.goto('/signup');
    await page.locator('#userName').fill('newtraveler');
    await page.locator('#firstName').fill('New');
    await page.locator('#lastName').fill('Traveler');
    await page.locator('#email').fill('new@example.com');
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');
    await page.locator('label.checkbox-label').first().click();
    await expect(page.locator('#acceptTerms')).toBeChecked();
    await page.locator('form.signup-form button[type=submit]').click();

    await expect(page).toHaveURL(/\/signin/, { timeout: 10_000 });
    expect(signupMethod).toBe('POST');
    const body = signupBody as Record<string, unknown>;
    expect(body['userName']).toBe('newtraveler');
    expect(body['email']).toBe('new@example.com');
  });

  test('signup rejects invalid input without navigating away', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('#userName').fill('x');
    await page.locator('#password').fill('short');
    await page.locator('#confirmPassword').fill('mismatch');

    await expect(page.locator('form.signup-form button[type=submit]')).toBeDisabled();
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

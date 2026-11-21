import { expect, test } from '@playwright/test';
import { adminUser, mockApi, regularUser } from './mocks';

test.describe('admin access', () => {
  test('an ADMIN user can open the admin dashboard', async ({ page }) => {
    await mockApi(page, { authenticated: true, user: adminUser });
    await page.route('**/api/admin/dashboard', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            users: { total: 2, active: 2, newThisWeek: 0 },
            posts: { total: 1, thisWeek: 0 },
            system: { uptime: '99.9%', lastBackup: 'today', storageUsed: '1 GB', performance: 'good' },
          },
        }),
      }),
    );

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.locator('app-admin').getByRole('link', { name: 'Users' })).toBeVisible();
  });

  test('a regular user is redirected away from /admin', async ({ page }) => {
    await mockApi(page, { authenticated: true, user: regularUser });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('an anonymous visitor is asked to sign in', async ({ page }) => {
    await mockApi(page, { authenticated: false });
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/signin$/);
  });
});

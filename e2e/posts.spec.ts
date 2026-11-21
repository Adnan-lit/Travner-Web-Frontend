import { expect, test } from '@playwright/test';
import { mockApi, regularUser } from './mocks';

test.describe('community posts', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { authenticated: true, user: regularUser });
  });

  test('the post list renders API results', async ({ page }) => {
    await page.route(/\/api\/posts(?:\?|$)/, async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'p1',
              title: 'Weekend in Lisbon',
              content: 'A long enough story about Lisbon.',
              authorName: 'alice',
              location: 'Lisbon',
              tags: ['food'],
              createdAt: '2026-11-20T10:00:00Z',
            },
          ],
          pagination: { page: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true },
        }),
      }),
    );

    await page.goto('/community');
    await expect(page.locator('.post-card')).toHaveCount(1);
    await expect(page.getByText('Weekend in Lisbon')).toBeVisible();
  });

  test('a signed-in traveler can create a post', async ({ page }) => {
    let created = false;
    await page.route(/\/api\/posts(?:\?|$)/, async (route) => {
      if (route.request().method() === 'POST') {
        created = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { id: 'p2', title: 'My new post' } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.goto('/community/new');
    await page.locator('#title').fill('My new post');
    await page.locator('#content').fill('This is a detailed travel story about my trip.');
    await page.locator('button[type=submit]').click();

    await expect(page).toHaveURL(/\/community$/);
    expect(created).toBe(true);
  });
});

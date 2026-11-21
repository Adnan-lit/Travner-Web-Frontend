import { expect, test } from '@playwright/test';
import { mockApi, regularUser } from './mocks';

const conversation = {
  id: 'c1',
  participantIds: [regularUser.id, '507f1f77bcf86cd799439099'],
  participants: [
    {
      id: '507f1f77bcf86cd799439099',
      username: 'bob',
      firstName: 'Bob',
      lastName: 'Builder',
      isOnline: true,
    },
  ],
  title: 'Bob Builder',
  type: 'DIRECT',
  lastMessage: 'See you in Lisbon!',
  lastMessageAt: '2026-11-20T10:00:00Z',
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-20T10:00:00Z',
  unreadCount: 1,
  isActive: true,
};

test.describe('chat', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { authenticated: true, user: regularUser });

    await page.route(/\/api\/chat\/conversations(?:\?|$)/, async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { content: [conversation], totalElements: 1, totalPages: 1 } }),
      }),
    );

    await page.route(/\/api\/chat\/conversations\/c1\/mark-read$/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      }),
    );

    await page.route(/\/api\/chat\/conversations\/c1\/messages(?:\?|$)/, async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'm1',
              conversationId: 'c1',
              senderId: '507f1f77bcf86cd799439099',
              content: 'See you in Lisbon!',
              createdAt: '2026-11-20T10:00:00Z',
              status: 'READ',
            },
          ],
        }),
      }),
    );
  });

  test('lists conversations and opens a thread', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.locator('.conversation-item')).toHaveCount(1);
    await expect(page.locator('.conversation-title')).toHaveText('bob');

    await page.locator('.conversation-item').click();
    await expect(page.locator('input.message-input')).toBeVisible();
    await expect(page.getByText('See you in Lisbon!').first()).toBeVisible();
  });

  test('does not pretend to send a message while disconnected', async ({ page }) => {
    await page.goto('/chat');
    await page.locator('.conversation-item').click();
    await page.locator('input.message-input').fill('Hello Bob');

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Not connected to chat server');
      await dialog.dismiss();
    });
    await page.locator('button.send-btn').click();

    await expect(page.locator('input.message-input')).toHaveValue('Hello Bob');
  });
});

import { expect, test } from '@playwright/test';
import { mockApi, regularUser } from './mocks';

const product = {
  id: 'prod1',
  name: 'Lisbon Day Pack',
  description: 'A light day pack for city walks.',
  price: 45,
  category: 'gear',
  stockQuantity: 5,
  location: 'Lisbon',
  tags: ['hiking'],
  images: ['/assets/images/placeholder-product-list.jpg'],
  sellerId: '507f1f77bcf86cd799439099',
  sellerUsername: 'bob',
  isAvailable: true,
  status: 'ACTIVE',
  createdAt: '2026-11-01T10:00:00Z',
  updatedAt: '2026-11-01T10:00:00Z',
};

test.describe('marketplace browse to checkout', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { authenticated: true, user: regularUser });

    await page.route(/\/api\/market\/products(?:\?|$)/, async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [product],
          pagination: { page: 0, size: 20, totalElements: 1, totalPages: 1, first: true, last: true },
        }),
      }),
    );

    await page.route('**/api/cart/count', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: 1 }),
      }),
    );

    await page.route('**/api/cart', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'cart1',
            items: [
              {
                lineId: 'line1',
                productId: 'prod1',
                titleSnapshot: 'Lisbon Day Pack',
                unitPrice: 45,
                quantity: 1,
              },
            ],
            totalAmount: 45,
          },
        }),
      }),
    );
  });

  test('browses products, adds one to the cart and proceeds to checkout', async ({ page }) => {
    let added = false;
    await page.route(/\/api\/cart\/items(?:\?|$)/, async (route) => {
      added = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.goto('/marketplace');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.locator('.product-card').getByText('Lisbon Day Pack')).toBeVisible();

    await page.locator('button.add-to-cart-button').click();
    await expect.poll(() => added).toBe(true);

    await page.goto('/marketplace/cart');
    await expect(page.getByRole('heading', { name: 'Your Shopping Cart' })).toBeVisible();
    await expect(page.locator('.cart-item').getByText('Lisbon Day Pack')).toBeVisible();

    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/\/marketplace\/checkout$/);
  });

  test('anonymous visitors cannot open the cart route', async ({ page }) => {
    await mockApi(page, { authenticated: false });
    await page.goto('/marketplace/cart');
    await expect(page).toHaveURL(/\/signin\?returnUrl=/);
  });
});

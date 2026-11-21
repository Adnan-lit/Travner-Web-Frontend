import { Page, Route } from '@playwright/test';

export interface MockUser {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export const regularUser: MockUser = {
  id: '507f1f77bcf86cd799439011',
  username: 'alice',
  email: 'alice@example.com',
  roles: ['USER'],
};

export const adminUser: MockUser = {
  id: '507f1f77bcf86cd799439012',
  username: 'admin',
  email: 'admin@example.com',
  roles: ['ADMIN'],
};

interface MockOptions {
  authenticated?: boolean;
  user?: MockUser;
}

const json = (body: unknown) => ({
  contentType: 'application/json',
  body: JSON.stringify(body),
});

const ok = <T>(data: T) => json({ success: true, data });

/**
 * Mock every backend call made by the SPA. Register this first in a test: a
 * route added later by an individual spec takes precedence.
 */
export async function mockApi(page: Page, options: MockOptions = {}): Promise<void> {
  const authenticated = options.authenticated ?? false;
  const user = options.user ?? regularUser;

  // Registered first so spec-specific routes win. Keep browser traffic on the
  // local dev server: no external avatar/CDN calls and no developer's backend.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:4200') {
      return route.abort();
    }
    return route.fallback();
  });

  // SockJS/STOMP is not part of the SPA API contract. Abort its HTTP handshake
  // and any raw WebSocket upgrade so tests never contact a developer's backend.
  await page.route('**/ws**', (route) => route.abort());
  await page.routeWebSocket('**/ws**', (ws) => ws.close());

  await page.route('**/api/**', async (route: Route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/api/auth/refresh') {
      if (!authenticated) {
        await route.fulfill({
          status: 401,
          ...json({ success: false, code: 'UNAUTHORIZED', message: 'Session expired', data: null }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        ...ok({ accessToken: 'e2e-access-token', tokenType: 'Bearer', expiresIn: 900, user }),
      });
      return;
    }

    if (path === '/api/auth/login') {
      await route.fulfill({
        status: 200,
        ...ok({ accessToken: 'e2e-access-token', tokenType: 'Bearer', expiresIn: 900, user }),
      });
      return;
    }

    if (path === '/api/auth/logout') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (path === '/api/auth/me') {
      await route.fulfill({ status: 200, ...ok(user) });
      return;
    }

    if (path.startsWith('/api/public/')) {
      await route.fulfill({ status: 200, ...ok({}) });
      return;
    }

    // Do not invent success for unrecognised endpoints: that would let a
    // misrouted or newly added call pass silently. Specs must mock explicitly.
    await route.abort();
  });
}

import { test as base, expect } from '@playwright/test';

/**
 * Extend the base test with Clerk authentication via Testing Tokens.
 *
 * Setup:
 *   1. Enable testing mode in Clerk Dashboard
 *   2. Set CLERK_TESTING_TOKEN in .env.local
 *   3. See: https://clerk.com/docs/testing/overview
 *
 * When CLERK_TESTING_TOKEN is not set, all authenticated tests are skipped.
 */
const clerkTestingToken = process.env.CLERK_TESTING_TOKEN;

export const test = base.extend<{ clerkAuth: void }>({
  clerkAuth: [async ({ page }, use) => {
    if (!clerkTestingToken) {
      test.skip(true, 'CLERK_TESTING_TOKEN not set — skipping authenticated test');
    }

    // Inject the Clerk testing token cookie before navigation
    await page.context().addCookies([{
      name: '__clerk_db_jwt',
      value: clerkTestingToken!,
      domain: 'localhost',
      path: '/',
    }]);

    await use();
  }, { auto: true }],
});

export { expect };

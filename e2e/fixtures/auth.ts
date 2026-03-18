import { test as base } from '@playwright/test';

/**
 * Extend the base test with Clerk authentication.
 *
 * Strategy options (choose one when implementing):
 *
 * 1. **Clerk Testing Tokens** (recommended)
 *    - Set CLERK_TESTING_TOKEN env var
 *    - Use Clerk's built-in test mode
 *    - See: https://clerk.com/docs/testing/overview
 *
 * 2. **storageState approach**
 *    - Run a setup project that logs in via Clerk UI
 *    - Save session to a JSON file
 *    - Reuse across tests via storageState
 */
export const test = base;
export { expect } from '@playwright/test';

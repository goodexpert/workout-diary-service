// e2e/flows/auth-flow.spec.ts
// Example: Clerk authentication flow — protected routes, unauthenticated redirects

import { test, expect } from '@playwright/test'
import { test as authTest, expect as authExpect } from '../../fixtures/auth'

// ─── Unauthenticated tests ─────────────────────────────────────────────────

test.describe('Landing Page (unauthenticated)', () => {
  test('shows hero section with sign-up CTA', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Your Personal Workout Diary' })).toBeVisible()
    await expect(page.getByText('Track your workouts, log exercises and sets')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' }).first()).toBeVisible()
  })

  test('shows feature cards', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Track Workouts' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Monitor Sets & Reps' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Review Progress' })).toBeVisible()
  })

  test('shows footer CTA section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Ready to start your fitness journey?' })).toBeVisible()
  })
})

test.describe('Protected Routes (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/workout/new',
    '/dashboard/workout/some-id',
    '/dashboard/workout/some-id/edit',
  ]

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(route)
      // Clerk middleware redirects to sign-in — user should NOT stay on the route
      await expect(page).not.toHaveURL(route)
    })
  }
})

// ─── Authenticated tests ────────────────────────────────────────────────────

authTest.describe('Authenticated User', () => {
  authTest('landing page redirects to dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/dashboard')
    await authExpect(page).toHaveURL(/\/dashboard/)
  })

  authTest('can access dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await authExpect(page).toHaveURL(/\/dashboard/)
    await authExpect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  authTest('can access settings', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await authExpect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  authTest('can navigate from dashboard to settings', async ({ page }) => {
    await page.goto('/dashboard')
    await authExpect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Click the settings button (gear icon)
    await page.getByRole('link', { name: /settings/i }).click()
    await page.waitForURL(/\/dashboard\/settings/)
    await authExpect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  authTest('can navigate from dashboard to new workout', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /Log New Workout/i }).click()
    await page.waitForURL(/\/dashboard\/workout\/new/)
    await authExpect(page.getByRole('heading', { name: 'Create New Workout' })).toBeVisible()
  })
})

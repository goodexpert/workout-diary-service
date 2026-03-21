import { test, expect } from '@playwright/test'
import { test as authTest, expect as authExpect } from '../fixtures/auth'

// ---- Unauthenticated tests ----

test.describe('Protected Routes (unauthenticated)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/workout/new',
  ]

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(route)
      // Clerk middleware redirects to sign-in
      await expect(page).not.toHaveURL(route)
    })
  }
})

// ---- Authenticated tests ----

authTest.describe('Authenticated User', () => {
  authTest('landing page redirects to dashboard', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/dashboard/)
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

  authTest('can access new workout form', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await authExpect(page.getByText('Create New Workout')).toBeVisible()
  })

  authTest('can navigate from dashboard to new workout', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /Log New Workout/i }).click()
    await page.waitForURL(/\/dashboard\/workout\/new/)
    await authExpect(page.getByText('Create New Workout')).toBeVisible()
  })

  authTest('can navigate from dashboard to settings', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('a[href*="/dashboard/settings"]').click()
    await page.waitForURL(/\/dashboard\/settings/)
    await authExpect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})

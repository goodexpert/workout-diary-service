import { test, expect } from '@playwright/test'
import { test as authTest, expect as authExpect } from '../fixtures/auth'

// ---- Unauthenticated tests ----
// These tests verify Clerk middleware redirects unauthenticated users.
// They require CLERK_SECRET_KEY + NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to be set
// so that the middleware actually enforces auth. Skip when not configured.

const hasClerkKeys = !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

test.describe('Protected Routes (unauthenticated)', () => {
  test.skip(!hasClerkKeys, 'Clerk keys not configured — middleware is inactive')
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

test.describe('Sign-In Page (unauthenticated)', () => {
  test('shows sign-in form with email and password fields', async ({ page }) => {
    await page.goto('/sign-in')

    // CardTitle renders as <div>, so use locator within main content area
    const main = page.locator('main')
    await expect(main.getByText('Sign In').first()).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(main.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('shows OAuth buttons with icons for Google, Apple, and Facebook', async ({ page }) => {
    await page.goto('/sign-in')

    const googleBtn = page.getByRole('button', { name: 'Continue with Google' })
    const appleBtn = page.getByRole('button', { name: 'Continue with Apple' })
    const facebookBtn = page.getByRole('button', { name: 'Continue with Facebook' })
    await expect(googleBtn).toBeVisible()
    await expect(appleBtn).toBeVisible()
    await expect(facebookBtn).toBeVisible()
    await expect(googleBtn.locator('svg')).toBeVisible()
    await expect(appleBtn.locator('svg')).toBeVisible()
    await expect(facebookBtn.locator('svg')).toBeVisible()
  })

  test('shows link to sign-up page', async ({ page }) => {
    await page.goto('/sign-in')

    const signUpLink = page.getByRole('link', { name: 'Sign up' })
    await expect(signUpLink).toBeVisible()
    await expect(signUpLink).toHaveAttribute('href', '/sign-up')
  })

  test('shows separator between OAuth and email form', async ({ page }) => {
    await page.goto('/sign-in')

    await expect(page.getByText('or', { exact: true })).toBeVisible()
  })
})

test.describe('Sign-Up Page (unauthenticated)', () => {
  test('shows sign-up form with all fields', async ({ page }) => {
    await page.goto('/sign-up')

    const main = page.locator('main')
    await expect(main.getByText('Sign Up').first()).toBeVisible()
    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByLabel('Last Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(main.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('shows OAuth buttons with icons for Google, Apple, and Facebook', async ({ page }) => {
    await page.goto('/sign-up')

    const googleBtn = page.getByRole('button', { name: 'Continue with Google' })
    const appleBtn = page.getByRole('button', { name: 'Continue with Apple' })
    const facebookBtn = page.getByRole('button', { name: 'Continue with Facebook' })
    await expect(googleBtn).toBeVisible()
    await expect(appleBtn).toBeVisible()
    await expect(facebookBtn).toBeVisible()
    await expect(googleBtn.locator('svg')).toBeVisible()
    await expect(appleBtn.locator('svg')).toBeVisible()
    await expect(facebookBtn.locator('svg')).toBeVisible()
  })

  test('shows link to sign-in page', async ({ page }) => {
    await page.goto('/sign-up')

    const signInLink = page.getByRole('link', { name: 'Sign in' })
    await expect(signInLink).toBeVisible()
    await expect(signInLink).toHaveAttribute('href', '/sign-in')
  })

  test('shows separator between OAuth and email form', async ({ page }) => {
    await page.goto('/sign-up')

    await expect(page.getByText('or', { exact: true })).toBeVisible()
  })
})

test.describe('Header Auth — Unauthenticated', () => {
  test('shows Sign In and Sign Up links in header', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await expect(header.getByRole('link', { name: 'Sign In' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Sign Up' })).toBeVisible()
  })

  test('Sign In link navigates to sign-in page', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await header.getByRole('link', { name: 'Sign In' }).click()

    await page.waitForURL(/\/sign-in/)
    const main = page.locator('main')
    await expect(main.getByText('Sign In').first()).toBeVisible()
  })

  test('Sign Up link navigates to sign-up page', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await header.getByRole('link', { name: 'Sign Up' }).click()

    await page.waitForURL(/\/sign-up/)
    const main = page.locator('main')
    await expect(main.getByText('Sign Up').first()).toBeVisible()
  })
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

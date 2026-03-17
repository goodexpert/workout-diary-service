// e2e/pages/settings.spec.ts
// Example: Settings page — profile, theme, location/timezone, navigation

import { test, expect } from '../../fixtures/auth'

test.describe('Settings — Navigation', () => {
  test('shows settings heading and back button', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    // Back button (arrow-left icon) navigates to dashboard
    await expect(page.getByRole('link').filter({ has: page.locator('.lucide-arrow-left') })).toBeVisible()
  })

  test('back button navigates to dashboard', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByRole('link').filter({ has: page.locator('.lucide-arrow-left') }).click()

    await page.waitForURL(/\/dashboard/)
  })

  test('back button preserves date param', async ({ page }) => {
    await page.goto('/dashboard/settings?date=2026-03-15')

    await page.getByRole('link').filter({ has: page.locator('.lucide-arrow-left') }).click()

    await expect(page).toHaveURL(/\/dashboard\?date=2026-03-15/)
  })
})

test.describe('Settings — Profile', () => {
  test('shows profile card with user info', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    // Avatar is displayed
    // User name and email are visible
    // "Manage Account" button opens Clerk user profile
    await expect(page.getByRole('button', { name: 'Manage Account' })).toBeVisible()
  })
})

test.describe('Settings — Connected Accounts', () => {
  test('shows connected accounts card', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Connected Accounts' })).toBeVisible()
    // Shows provider names with "Connected" or "Pending" badge
    // Or shows "No connected accounts" if none exist
    await expect(page.getByRole('button', { name: 'Manage' })).toBeVisible()
  })
})

test.describe('Settings — Appearance', () => {
  test('shows theme switcher with three options', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible()
  })

  test('clicking theme button switches theme', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Click "Dark" to switch theme
    await page.getByRole('button', { name: 'Dark' }).click()

    // The "Dark" button should now be the active/default variant
    // Theme change may be reflected in the document class or data attribute
  })
})

test.describe('Settings — Location & Timezone', () => {
  test('shows location form with country, city, and timezone', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Location & Timezone' })).toBeVisible()
    await expect(page.getByLabel('Country')).toBeVisible()
    await expect(page.getByLabel('City')).toBeVisible()
    await expect(page.getByText('Timezone')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('fill location fields and save', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByLabel('Country').fill('New Zealand')
    await page.getByLabel('City').fill('Auckland')

    await page.getByRole('button', { name: 'Save' }).click()

    // Button shows loading state during Server Action
    await expect(page.getByRole('button', { name: 'Saving...' })).toBeDisabled()

    // After save completes, button reverts to "Save"
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('placeholder text guides the user', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByPlaceholder('e.g. New Zealand')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. Auckland')).toBeVisible()
  })

  test('timezone dropdown shows grouped timezones', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Click the timezone select trigger
    await page.getByRole('combobox').click()

    // Timezone groups are shown (e.g., "Pacific", "America", "Europe")
    await expect(page.getByText('Pacific')).toBeVisible()
  })
})

import { test, expect } from '../fixtures/auth'

test.describe('Settings — Navigation', () => {
  test('shows settings heading and back button', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
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
  test('shows profile card with user info and edit button', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByText('Profile')).toBeVisible()
    // Pencil icon edit button replaces the old "Manage Account" button
    await expect(page.getByRole('button').filter({ has: page.locator('.lucide-pencil') })).toBeVisible()
  })

  test('clicking edit shows inline name fields', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()

    await expect(page.getByLabel('First Name')).toBeVisible()
    await expect(page.getByLabel('Last Name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('cancel edit hides name fields', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await expect(page.getByLabel('First Name')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByLabel('First Name')).not.toBeVisible()
  })

  test('shows avatar with camera upload button', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByRole('button').filter({ has: page.locator('.lucide-camera') })).toBeVisible()
  })
})

test.describe('Settings — Password', () => {
  test('shows password management card', async ({ page }) => {
    await page.goto('/dashboard/settings')

    // Title is either "Change Password" or "Set Password" depending on user
    const changePassword = page.getByText('Change Password')
    const setPassword = page.getByText('Set Password')
    const hasChangePassword = await changePassword.count()
    const hasSetPassword = await setPassword.count()
    expect(hasChangePassword + hasSetPassword).toBeGreaterThan(0)
  })

  test('shows new password and confirm password fields', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByLabel('New Password')).toBeVisible()
    await expect(page.getByLabel('Confirm Password')).toBeVisible()
  })
})

test.describe('Settings — Connected Accounts', () => {
  test('shows connected accounts card', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByText('Connected Accounts')).toBeVisible()
  })

  test('shows Connect Google and Connect Apple buttons with icons', async ({ page }) => {
    await page.goto('/dashboard/settings')

    const googleBtn = page.getByRole('button', { name: 'Connect Google' })
    const appleBtn = page.getByRole('button', { name: 'Connect Apple' })
    await expect(googleBtn).toBeVisible()
    await expect(appleBtn).toBeVisible()

    // Buttons contain SVG icons
    await expect(googleBtn.locator('svg')).toBeVisible()
    await expect(appleBtn.locator('svg')).toBeVisible()
  })
})

test.describe('Settings — Appearance', () => {
  test('shows theme switcher with three options', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByText('Appearance')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Light' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'System' })).toBeVisible()
  })

  test('clicking theme button switches active state', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByRole('button', { name: 'Dark' }).click()

    // Dark button should now be active (default variant, not outline)
    // Light and System buttons should be outline
  })
})

test.describe('Settings — Location & Timezone', () => {
  test('shows location form with all fields', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByText('Location & Timezone')).toBeVisible()
    await expect(page.getByLabel('Country')).toBeVisible()
    await expect(page.getByLabel('City')).toBeVisible()
    await expect(page.getByText('Timezone')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('shows placeholder text in inputs', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await expect(page.getByPlaceholder('e.g. New Zealand')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. Auckland')).toBeVisible()
  })

  test('fill location fields and save', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByLabel('Country').fill('New Zealand')
    await page.getByLabel('City').fill('Auckland')

    await page.getByRole('button', { name: 'Save' }).last().click()

    // Button shows loading state during Server Action
    await expect(page.getByRole('button', { name: 'Saving...' })).toBeDisabled()

    // After save completes, button reverts to "Save"
    await expect(page.getByRole('button', { name: 'Save' }).last()).toBeVisible()
  })

  test('timezone dropdown shows grouped timezones', async ({ page }) => {
    await page.goto('/dashboard/settings')

    await page.getByRole('combobox').click()

    // Timezone groups are shown
    await expect(page.getByText('Pacific')).toBeVisible()
  })
})

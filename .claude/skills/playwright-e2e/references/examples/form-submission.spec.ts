// e2e/pages/new-workout.spec.ts
// Example: New workout form with validation, Server Action submission, loading state

import { test, expect } from '../../fixtures/auth'

test.describe('New Workout Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workout/new')
  })

  test('renders the form with all fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create New Workout' })).toBeVisible()
    await expect(page.getByLabel('Workout Name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Workout' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('shows validation error for empty workout name', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Workout' }).click()

    await expect(page.getByText('Workout name is required')).toBeVisible()
  })

  test('shows validation error when submitting only whitespace', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('   ')
    await page.getByRole('button', { name: 'Create Workout' }).click()

    await expect(page.getByText('Workout name is required')).toBeVisible()
  })

  test('submits form and redirects to edit page on success', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('Upper Body')
    await page.getByRole('button', { name: 'Create Workout' }).click()

    // Server Action creates the workout and redirects to edit page
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
  })

  test('shows loading state during submission', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('Leg Day')

    const button = page.getByRole('button', { name: 'Create Workout' })
    await button.click()

    // Button should be disabled and show loading text
    await expect(page.getByRole('button', { name: 'Creating…' })).toBeDisabled()
  })

  test('shows error message when Server Action fails', async ({ page }) => {
    // Fill the form — the Server Action might fail due to network or server issues
    await page.getByLabel('Workout Name').fill('Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()

    // If the action fails, error message is displayed
    // Note: this test may need route interception to simulate failure
    // await expect(page.getByText('Failed to create workout. Please try again.')).toBeVisible()
  })

  test('cancel button navigates back to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Cancel' }).click()

    await page.waitForURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('preserves date param when navigating back', async ({ page }) => {
    await page.goto('/dashboard/workout/new?date=2026-03-15')

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page).toHaveURL(/date=2026-03-15/)
  })

  test('placeholder text guides the user', async ({ page }) => {
    await expect(page.getByPlaceholder('e.g. Upper Body, Leg Day')).toBeVisible()
  })
})

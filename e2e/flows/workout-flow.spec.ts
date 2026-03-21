import { test, expect } from '../fixtures/auth'

test.describe('Workout End-to-End Flow', () => {
  test('create workout, view it, edit name, complete it, and return to dashboard', async ({ page }) => {
    // Step 1: Navigate to new workout form from dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.getByRole('link', { name: /Log New Workout/i }).click()
    await page.waitForURL(/\/dashboard\/workout\/new/)

    // Step 2: Create a new workout
    await page.getByLabel('Workout Name').fill('E2E Flow Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    // Step 3: Verify edit mode
    await expect(page.getByRole('heading', { level: 1, name: 'E2E Flow Workout' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Complete Workout' })).toBeVisible()
    await expect(page.getByText('No exercises added yet.')).toBeVisible()

    // Step 4: Edit workout name inline
    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await page.getByRole('textbox').first().fill('Renamed E2E Workout')
    await page.getByRole('textbox').first().press('Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Renamed E2E Workout' })).toBeVisible()

    // Step 5: Complete the workout
    await page.getByRole('button', { name: 'Complete Workout' }).click()
    await expect(page.getByText('Completed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled()

    // Step 6: Navigate to view mode
    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)
    await expect(page.getByRole('heading', { level: 1, name: 'Renamed E2E Workout' })).toBeVisible()
    await expect(page.getByText('Completed')).toBeVisible()

    // Step 7: Return to dashboard
    await page.getByRole('button', { name: 'Back to Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('create workout and cancel navigates back to dashboard', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await expect(page.getByText('Create New Workout')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await page.waitForURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('create workout with specific date preserves date context', async ({ page }) => {
    await page.goto('/dashboard?date=2026-03-15')

    await page.getByRole('link', { name: /Log New Workout/i }).click()
    await page.waitForURL(/\/dashboard\/workout\/new/)
    await expect(page).toHaveURL(/date=2026-03-15/)

    await page.getByLabel('Workout Name').fill('Dated Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    // Date param should be preserved
    await expect(page).toHaveURL(/date=2026-03-15/)

    // Back to dashboard preserves date
    await page.getByRole('button', { name: 'Back to Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard\?date=2026-03-15/)
  })
})

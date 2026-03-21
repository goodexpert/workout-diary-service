import { test, expect } from '../fixtures/auth'

test.describe('New Workout Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workout/new')
  })

  test('renders form with all fields', async ({ page }) => {
    await expect(page.getByText('Create New Workout')).toBeVisible()
    await expect(page.getByLabel('Workout Name')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Workout' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('shows placeholder text', async ({ page }) => {
    await expect(page.getByPlaceholder('e.g. Upper Body, Leg Day')).toBeVisible()
  })

  test('shows validation error for empty workout name', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Workout' }).click()

    await expect(page.getByText('Workout name is required')).toBeVisible()
  })

  test('shows validation error for whitespace-only name', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('   ')
    await page.getByRole('button', { name: 'Create Workout' }).click()

    await expect(page.getByText('Workout name is required')).toBeVisible()
  })

  test('submits form and redirects to edit page', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('Upper Body')
    await page.getByRole('button', { name: 'Create Workout' }).click()

    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
  })

  test('shows loading state during submission', async ({ page }) => {
    await page.getByLabel('Workout Name').fill('Leg Day')

    await page.getByRole('button', { name: 'Create Workout' }).click()

    await expect(page.getByRole('button', { name: /Creating/ })).toBeDisabled()
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

  test('shows Started At date picker', async ({ page }) => {
    await expect(page.getByText('Started At')).toBeVisible()
  })
})

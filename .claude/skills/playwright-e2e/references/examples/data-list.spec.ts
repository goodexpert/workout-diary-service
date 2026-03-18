// e2e/pages/dashboard.spec.ts
// Example: Dashboard workout list with empty / populated states and date navigation

import { test, expect } from '../../fixtures/auth'

test.describe('Dashboard — Workout List', () => {
  test('shows empty state when no workouts exist for date', async ({ page }) => {
    await page.goto('/dashboard?date=2026-01-01')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('No workouts logged for this date')).toBeVisible()
  })

  test('shows workout cards when workouts exist', async ({ page }) => {
    // Navigate to a date with workout data
    await page.goto('/dashboard')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    // If workouts exist, cards should be visible with workout names
    // The actual assertions depend on test data seeded for the environment
  })

  test('workout card shows name, time, and exercise badges', async ({ page }) => {
    await page.goto('/dashboard')

    // Workout cards are wrapped in <Link> > <Card> — each card has a heading and badges
    const firstCard = page.getByRole('link').filter({ hasText: /Completed|In progress/ }).first()
    await expect(firstCard.getByRole('heading')).toBeVisible()
    // Time is displayed as e.g. "9:00 AM"
    await expect(firstCard.getByText(/\d{1,2}:\d{2}\s(?:AM|PM)/)).toBeVisible()
  })

  test('workout card shows completion status badge', async ({ page }) => {
    await page.goto('/dashboard')

    // Each workout card has a "Completed" or "In progress" badge
    const badge = page.getByText(/Completed|In progress/)
    await expect(badge.first()).toBeVisible()
  })

  test('clicking a workout card navigates to workout detail', async ({ page }) => {
    await page.goto('/dashboard')

    // Workout cards are <Link> elements wrapping <Card> components
    const workoutLink = page.getByRole('link').filter({ hasText: /Completed|In progress/ }).first()
    await workoutLink.click()

    await page.waitForURL(/\/dashboard\/workout\//)
  })
})

test.describe('Dashboard — Date Navigation', () => {
  test('URL date param controls which date is displayed', async ({ page }) => {
    await page.goto('/dashboard?date=2026-03-15')

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    // The date picker button should reflect the selected date
    await expect(page.getByRole('button', { name: /15th Mar 2026/ })).toBeVisible()
  })

  test('Log New Workout link includes current date', async ({ page }) => {
    await page.goto('/dashboard?date=2026-03-15')

    const newWorkoutLink = page.getByRole('link', { name: /Log New Workout/i })
    await expect(newWorkoutLink).toHaveAttribute('href', /date=2026-03-15/)
  })

  test('settings link includes current date', async ({ page }) => {
    await page.goto('/dashboard?date=2026-03-15')

    const settingsLink = page.getByRole('link', { name: /settings/i })
    await expect(settingsLink).toHaveAttribute('href', /date=2026-03-15/)
  })
})

test.describe('Dashboard — Actions', () => {
  test('Log New Workout button navigates to new workout form', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /Log New Workout/i }).click()
    await page.waitForURL(/\/dashboard\/workout\/new/)
    await expect(page.getByRole('heading', { name: 'Create New Workout' })).toBeVisible()
  })
})

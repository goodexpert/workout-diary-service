import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows hero section with heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Your Personal Workout Diary' })).toBeVisible()
    await expect(page.getByText('Track your workouts, log exercises and sets')).toBeVisible()
  })

  test('shows Get Started sign-up CTA buttons', async ({ page }) => {
    const buttons = page.getByRole('button', { name: 'Get Started' })
    await expect(buttons).toHaveCount(2)
    await expect(buttons.first()).toBeVisible()
  })

  test('shows feature cards section', async ({ page }) => {
    await expect(page.getByText('FEATURES')).toBeVisible()
    await expect(page.getByText('Track Workouts')).toBeVisible()
    await expect(page.getByText('Monitor Sets & Reps')).toBeVisible()
    await expect(page.getByText('Review Progress')).toBeVisible()
  })

  test('shows feature card descriptions', async ({ page }) => {
    await expect(page.getByText('Log each workout session with date and exercises.')).toBeVisible()
    await expect(page.getByText('Record weight and repetitions for every set you perform.')).toBeVisible()
    await expect(page.getByText('Browse your workout history by date.')).toBeVisible()
  })

  test('shows footer CTA section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ready to start your fitness journey?' })).toBeVisible()
    await expect(page.getByText('Sign up for free and begin tracking your workouts today.')).toBeVisible()
  })
})

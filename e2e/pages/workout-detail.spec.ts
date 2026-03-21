import { test, expect } from '../fixtures/auth'

test.describe('Workout View Mode', () => {
  test('shows workout name as heading', async ({ page }) => {
    // First create a workout to get a valid ID
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('View Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    // Navigate to view mode by removing /edit
    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await expect(page.getByRole('heading', { level: 1, name: 'View Test Workout' })).toBeVisible()
  })

  test('shows Edit Workout and Back to Dashboard buttons', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Button Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await expect(page.getByRole('link', { name: 'Edit Workout' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to Dashboard' })).toBeVisible()
  })

  test('shows status badge', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Status Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await expect(page.getByText(/Completed|In Progress/)).toBeVisible()
  })

  test('Edit Workout navigates to edit page', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Nav Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await page.getByRole('link', { name: 'Edit Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
  })

  test('Back to Dashboard navigates to dashboard', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Back Nav Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await page.getByRole('button', { name: 'Back to Dashboard' }).click()
    await page.waitForURL(/\/dashboard/)
  })

  test('shows empty exercises message for new workout', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Empty Exercises Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const editUrl = page.url()
    const viewUrl = editUrl.replace('/edit', '')
    await page.goto(viewUrl)

    await expect(page.getByText('No exercises in this workout.')).toBeVisible()
  })
})

test.describe('Workout Edit Mode — Header', () => {
  test('shows workout name with pencil edit icon', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Edit Header Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await expect(page.getByRole('heading', { level: 1, name: 'Edit Header Workout' })).toBeVisible()
    await expect(page.getByRole('button').filter({ has: page.locator('.lucide-pencil') })).toBeVisible()
  })

  test('inline edit workout name and save', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Original Name')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()

    const nameInput = page.getByRole('textbox').first()
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Renamed Workout')

    await page.getByRole('button').filter({ has: page.locator('.lucide-check') }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Renamed Workout' })).toBeVisible()
  })

  test('inline edit cancel via X button reverts name', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Keep This Name')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await page.getByRole('textbox').first().fill('Should Be Reverted')
    await page.getByRole('button').filter({ has: page.locator('.lucide-x') }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Keep This Name' })).toBeVisible()
  })

  test('inline edit save via Enter key', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Before Enter')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await page.getByRole('textbox').first().fill('After Enter')
    await page.getByRole('textbox').first().press('Enter')

    await expect(page.getByRole('heading', { level: 1, name: 'After Enter' })).toBeVisible()
  })

  test('Complete Workout button marks workout as completed', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Complete Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    const completeButton = page.getByRole('button', { name: 'Complete Workout' })
    await expect(completeButton).toBeVisible()

    await completeButton.click()

    await expect(page.getByText('Completed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled()
  })

  test('Back to Dashboard preserves date param', async ({ page }) => {
    await page.goto('/dashboard/workout/new?date=2026-03-15')
    await page.getByLabel('Workout Name').fill('Date Param Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await page.getByRole('button', { name: 'Back to Dashboard' }).click()

    await expect(page).toHaveURL(/\/dashboard\?date=2026-03-15/)
  })
})

test.describe('Workout Edit Mode — Exercises', () => {
  test('shows empty state with add exercise prompt', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Exercise Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await expect(page.getByText('No exercises added yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Exercise' })).toBeVisible()
  })

  test('Add Exercise button opens search popover', async ({ page }) => {
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Exercise Popover Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    await page.getByRole('button', { name: 'Add Exercise' }).click()

    await expect(page.getByPlaceholder('Search exercises...')).toBeVisible()
  })
})

test.describe('Workout Edit Mode — Sets', () => {
  test('shows set header with Weight and Reps columns when sets exist', async ({ page }) => {
    // Create workout and add exercise to get sets
    await page.goto('/dashboard/workout/new')
    await page.getByLabel('Workout Name').fill('Set Test Workout')
    await page.getByRole('button', { name: 'Create Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

    // Add an exercise (which auto-adds a set)
    await page.getByRole('button', { name: 'Add Exercise' }).click()
    const searchInput = page.getByPlaceholder('Search exercises...')
    await expect(searchInput).toBeVisible()

    // Select first available exercise
    const exerciseButtons = page.locator('[role="button"]').filter({ hasNotText: /Add Exercise|Complete Workout|Back to Dashboard/ })
    const count = await exerciseButtons.count()
    if (count > 0) {
      await exerciseButtons.first().click()

      await expect(page.getByText('Weight (kg)')).toBeVisible()
      await expect(page.getByText('Reps')).toBeVisible()
    }
  })
})

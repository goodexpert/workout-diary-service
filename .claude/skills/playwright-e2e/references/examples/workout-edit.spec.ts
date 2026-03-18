// e2e/pages/workout-edit.spec.ts
// Example: Workout view/edit page — inline editing, exercises, sets, complete workout

import { test, expect } from '../../fixtures/auth'

test.describe('Workout View Mode', () => {
  test('shows workout details in read-only mode', async ({ page }) => {
    // Navigate to a workout in view mode (no /edit suffix)
    await page.goto('/dashboard/workout/some-id')

    // Heading shows workout name
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Status badge is visible (Completed or In Progress)
    await expect(page.getByText(/Completed|In Progress/)).toBeVisible()
    // Edit Workout button links to edit page
    await expect(page.getByRole('button', { name: 'Edit Workout' })).toBeVisible()
    // Back to Dashboard button
    await expect(page.getByRole('button', { name: 'Back to Dashboard' })).toBeVisible()
  })

  test('edit workout button navigates to edit page', async ({ page }) => {
    await page.goto('/dashboard/workout/some-id')

    await page.getByRole('button', { name: 'Edit Workout' }).click()
    await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
  })

  test('shows exercises and sets in read-only mode', async ({ page }) => {
    await page.goto('/dashboard/workout/some-id')

    // Exercise cards show exercise name as heading
    // Sets show weight and reps as text (or "—" if null)
    // No edit controls (no pencil icon, no add/remove buttons)
  })

  test('shows empty state when no exercises', async ({ page }) => {
    await page.goto('/dashboard/workout/some-id')

    // If workout has no exercises
    await expect(page.getByText('No exercises in this workout.')).toBeVisible()
  })
})

test.describe('Workout Edit Mode — Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workout/some-id/edit')
  })

  test('shows workout name with pencil edit icon', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Pencil icon button for inline name editing
    await expect(page.getByRole('button').filter({ has: page.locator('.lucide-pencil') })).toBeVisible()
  })

  test('inline edit workout name and save', async ({ page }) => {
    // Click pencil to enter edit mode
    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()

    const nameInput = page.getByRole('textbox').first()
    await expect(nameInput).toBeVisible()

    await nameInput.fill('Renamed Workout')

    // Click check icon to save
    await page.getByRole('button').filter({ has: page.locator('.lucide-check') }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Renamed Workout' })).toBeVisible()
  })

  test('inline edit cancel via X button reverts name', async ({ page }) => {
    const originalName = await page.getByRole('heading', { level: 1 }).textContent()

    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await page.getByRole('textbox').first().fill('Should Revert')
    await page.getByRole('button').filter({ has: page.locator('.lucide-x') }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(originalName!)
  })

  test('inline edit save via Enter key', async ({ page }) => {
    await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
    await page.getByRole('textbox').first().fill('Enter Key Save')
    await page.getByRole('textbox').first().press('Enter')

    await expect(page.getByRole('heading', { level: 1, name: 'Enter Key Save' })).toBeVisible()
  })

  test('complete workout button marks workout as completed', async ({ page }) => {
    const completeButton = page.getByRole('button', { name: 'Complete Workout' })
    await expect(completeButton).toBeVisible()

    await completeButton.click()

    // After completion, status changes and button becomes disabled
    await expect(page.getByText('Completed')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled()
  })

  test('back to dashboard preserves date param', async ({ page }) => {
    await page.goto('/dashboard/workout/some-id/edit?date=2026-03-15')

    await page.getByRole('button', { name: 'Back to Dashboard' }).click()

    await expect(page).toHaveURL(/\/dashboard\?date=2026-03-15/)
  })
})

test.describe('Workout Edit Mode — Exercises', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workout/some-id/edit')
  })

  test('shows empty state with add exercise prompt', async ({ page }) => {
    // If no exercises exist
    await expect(page.getByText('No exercises added yet.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Exercise' })).toBeVisible()
  })

  test('add exercise via search popover', async ({ page }) => {
    // Open "Add Exercise" popover
    await page.getByRole('button', { name: 'Add Exercise' }).click()

    // Search input appears
    const searchInput = page.getByPlaceholder('Search exercises...')
    await expect(searchInput).toBeVisible()

    // Type to filter exercises
    await searchInput.fill('Bench')

    // Click an exercise from the filtered list
    await page.getByRole('button', { name: /Bench Press/i }).click()

    // Exercise card appears with the selected exercise name
    await expect(page.getByRole('heading', { name: /Bench Press/i })).toBeVisible()
  })

  test('remove exercise via trash icon', async ({ page }) => {
    // Assuming an exercise card exists
    const exerciseCard = page.locator('.relative').filter({ has: page.getByRole('heading') }).first()

    // Click trash icon on the exercise card
    await exerciseCard.getByRole('button').filter({ has: page.locator('.text-destructive') }).click()

    // Exercise should be removed (card disappears)
  })

  test('change exercise by clicking exercise name', async ({ page }) => {
    // In edit mode, exercise name is clickable to open change popover
    const exerciseHeading = page.locator('.cursor-pointer.hover\\:underline').first()
    await exerciseHeading.click()

    // Search popover appears
    await expect(page.getByPlaceholder('Search exercises...')).toBeVisible()

    // Select a different exercise
    // The new exercise name should replace the old one
  })
})

test.describe('Workout Edit Mode — Sets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/workout/some-id/edit')
  })

  test('shows set header row with Weight and Reps columns', async ({ page }) => {
    await expect(page.getByText('Weight (kg)')).toBeVisible()
    await expect(page.getByText('Reps')).toBeVisible()
  })

  test('add set via plus icon on exercise card', async ({ page }) => {
    const exerciseCard = page.locator('.relative').filter({ has: page.getByRole('heading') }).first()

    // Plus icon in the card header adds a new set
    await exerciseCard.getByRole('button').filter({ has: page.locator('.lucide-plus') }).click()

    // A new set row appears with empty weight and reps inputs
  })

  test('edit set weight and reps', async ({ page }) => {
    const weightInput = page.getByPlaceholder('Weight').first()
    const repsInput = page.getByPlaceholder('Reps').first()

    await weightInput.fill('80')
    await weightInput.blur()

    await repsInput.fill('10')
    await repsInput.blur()

    // Values persist after blur (Server Action saves on blur)
    await expect(weightInput).toHaveValue('80')
    await expect(repsInput).toHaveValue('10')
  })

  test('duplicate set copies weight and reps', async ({ page }) => {
    // Copy icon duplicates the set with same weight/reps
    const copyButton = page.getByRole('button').filter({ has: page.locator('.lucide-copy') }).first()
    await copyButton.click()

    // A new set row appears with the same values
  })

  test('remove set via X icon', async ({ page }) => {
    // X icon on a set row removes it
    const removeButton = page.getByRole('button').filter({ has: page.locator('.lucide-x') }).first()
    await removeButton.click()

    // Set row is removed
  })
})

# Playwright Patterns for Workout Diary (Next.js + Clerk)

## Selector Strategy

### Priority Order
Always prefer selectors in this order — top is most resilient to refactoring:

```typescript
// ✅ 1. Role-based (best — reflects what users see)
page.getByRole('button', { name: 'Create Workout' })
page.getByRole('heading', { name: 'Dashboard' })
page.getByRole('link', { name: 'Log New Workout' })

// ✅ 2. Label-based (great for forms)
page.getByLabel('Workout Name')
page.getByLabel('Country')

// ✅ 3. Placeholder
page.getByPlaceholder('e.g. Upper Body, Leg Day')

// ✅ 4. Text content
page.getByText('No workouts logged for this date')

// ✅ 5. Test ID (explicit, immune to UI changes — add data-testid to component)
page.getByTestId('workout-card')

// ⚠️ 6. CSS/XPath (last resort — brittle)
page.locator('.workout-card')
```

### When to add `data-testid`
Add to your React component when:
- The element has no accessible role or label
- Multiple similar elements exist and need differentiation
- The element is interactive but text changes dynamically

```tsx
// In your React component:
<Card data-testid="workout-card">
  <CardTitle>{workout.name}</CardTitle>
</Card>
```

---

## Page Object Model (POM)

Use POM for pages tested in multiple spec files. Not needed for pages only tested once.

```typescript
// e2e/helpers/pages/DashboardPage.ts
import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly newWorkoutButton: Locator
  readonly emptyMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Dashboard' })
    this.newWorkoutButton = page.getByRole('link', { name: 'Log New Workout' })
    this.emptyMessage = page.getByText('No workouts logged for this date')
  }

  async goto(date?: string) {
    const url = date ? `/dashboard?date=${date}` : '/dashboard'
    await this.page.goto(url)
  }

  async navigateToNewWorkout() {
    await this.newWorkoutButton.click()
  }
}
```

```typescript
// In your spec:
import { DashboardPage } from '../helpers/pages/DashboardPage'

test('dashboard loads correctly', async ({ page }) => {
  const dashboard = new DashboardPage(page)
  await dashboard.goto()
  await expect(dashboard.heading).toBeVisible()
})
```

---

## Clerk Auth Fixtures

This project uses **Clerk** for authentication. There is no `/login` page — Clerk uses modal-based sign-in.

### Strategy: Clerk Testing Tokens (recommended)

Clerk provides testing tokens that bypass the UI sign-in flow:

```typescript
// e2e/fixtures/auth.ts
import { test as base } from '@playwright/test'

/**
 * Extend the base test with Clerk authentication.
 *
 * Strategy: Clerk Testing Tokens
 * - Set CLERK_TESTING_TOKEN env var
 * - Use Clerk's built-in test mode
 * - See: https://clerk.com/docs/testing/overview
 */
export const test = base
export { expect } from '@playwright/test'
```

### Using in tests

**Protected routes** — import from the auth fixture:
```typescript
import { test, expect } from '../fixtures/auth'

test('dashboard shows workouts', async ({ page }) => {
  await page.goto('/dashboard')  // auth handled by fixture
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

**Public routes** — import from Playwright directly:
```typescript
import { test, expect } from '@playwright/test'

test('landing page renders for guests', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your Personal Workout Diary' })).toBeVisible()
})
```

**Testing unauthenticated redirects** — use empty storage state:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Protected Routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/settings',
    '/dashboard/workout/new',
    '/dashboard/workout/some-id',
    '/dashboard/workout/some-id/edit',
  ]

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated users`, async ({ page }) => {
      await page.goto(route)
      // Clerk redirects to its sign-in page or shows sign-in modal
      await expect(page).not.toHaveURL(route)
    })
  }
})
```

---

## Server Action Testing

This project uses **Server Actions** instead of REST API routes.
Server Actions are invoked via form submissions or direct function calls from client components.

### Testing forms that call Server Actions
```typescript
test('creates a new workout via Server Action', async ({ page }) => {
  await page.goto('/dashboard/workout/new')

  await page.getByLabel('Workout Name').fill('Upper Body')
  await page.getByRole('button', { name: 'Create Workout' }).click()

  // Server Action redirects on success
  await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
})
```

### Testing Server Action error states
```typescript
test('shows error when Server Action fails', async ({ page }) => {
  await page.goto('/dashboard/workout/new')

  // Submit without filling required fields
  await page.getByRole('button', { name: 'Create Workout' }).click()

  // Validation error shown
  await expect(page.getByText('Workout name is required')).toBeVisible()
})
```

### Testing button loading states during Server Action
```typescript
test('shows loading state during submission', async ({ page }) => {
  await page.goto('/dashboard/workout/new')

  await page.getByLabel('Workout Name').fill('Leg Day')
  const button = page.getByRole('button', { name: 'Create Workout' })
  await button.click()

  // Button should show loading text and be disabled
  await expect(page.getByRole('button', { name: 'Creating…' })).toBeDisabled()
})
```

### Testing button-triggered Server Actions
Actions triggered by button clicks (not form submissions):
```typescript
test('completes a workout via button click', async ({ page }) => {
  await page.goto('/dashboard/workout/some-id/edit')

  await page.getByRole('button', { name: 'Complete Workout' }).click()

  // Status changes to "Completed"
  await expect(page.getByText('Completed')).toBeVisible()
  // Button becomes disabled after completion
  await expect(page.getByRole('button', { name: 'Completed' })).toBeDisabled()
})
```

---

## Dialog / Modal Testing

This project uses `Dialog` components for confirmations (delete, duplicate).
Dialogs are triggered by icon buttons inside workout cards.

### Testing a confirmation dialog
```typescript
test('delete dialog confirms and removes workout', async ({ page }) => {
  await page.goto('/dashboard')

  // Open the delete dialog (trigger is an icon button inside the card)
  const firstCard = page.getByRole('link').filter({ hasText: /Completed|In progress/ }).first()
  await firstCard.getByRole('button').filter({ has: page.locator('.text-destructive') }).click()

  // Dialog appears with confirmation message
  await expect(page.getByRole('heading', { name: 'Delete Workout?' })).toBeVisible()
  await expect(page.getByText('This action cannot be undone.')).toBeVisible()

  // Cancel closes dialog without deleting
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Delete Workout?' })).not.toBeVisible()
})

test('delete dialog shows loading state on confirm', async ({ page }) => {
  await page.goto('/dashboard')

  const firstCard = page.getByRole('link').filter({ hasText: /Completed|In progress/ }).first()
  await firstCard.getByRole('button').filter({ has: page.locator('.text-destructive') }).click()

  await page.getByRole('button', { name: 'Delete' }).click()

  // Button shows loading text
  await expect(page.getByRole('button', { name: 'Deleting...' })).toBeDisabled()
})
```

### Testing a multi-step dialog (duplicate workout)
```typescript
test('duplicate dialog selects date and shows success', async ({ page }) => {
  await page.goto('/dashboard')

  // Open duplicate dialog
  const firstCard = page.getByRole('link').filter({ hasText: /Completed|In progress/ }).first()
  // Duplicate trigger has a Copy icon
  await firstCard.getByRole('button').nth(0).click()

  // Dialog shows calendar for date selection
  await expect(page.getByRole('heading', { name: 'Duplicate Workout' })).toBeVisible()

  // Select a date from the calendar, then confirm
  await page.getByRole('button', { name: 'Duplicate' }).click()

  // Success state shows navigation options
  await expect(page.getByRole('heading', { name: 'Workout Duplicated' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Go to Date' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Stay Here' })).toBeVisible()
})
```

---

## Inline Editing

Some components toggle between view and edit modes in-place.
The workout edit page uses this pattern for the workout name.

```typescript
test('inline edit workout name', async ({ page }) => {
  await page.goto('/dashboard/workout/some-id/edit')

  // Workout name is displayed as a heading
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toBeVisible()

  // Click pencil icon to enter edit mode
  await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()

  // Input appears with current name
  const nameInput = page.getByRole('textbox')
  await expect(nameInput).toBeVisible()

  // Clear and type new name
  await nameInput.fill('Updated Workout Name')

  // Save via check button
  await page.getByRole('button').filter({ has: page.locator('.lucide-check') }).click()

  // Heading updates to new name
  await expect(page.getByRole('heading', { level: 1, name: 'Updated Workout Name' })).toBeVisible()
})

test('inline edit cancel reverts name', async ({ page }) => {
  await page.goto('/dashboard/workout/some-id/edit')

  const originalName = await page.getByRole('heading', { level: 1 }).textContent()

  // Enter edit mode
  await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()

  // Type different name
  await page.getByRole('textbox').fill('Should Be Reverted')

  // Cancel via X button
  await page.getByRole('button').filter({ has: page.locator('.lucide-x') }).click()

  // Name reverts to original
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(originalName!)
})

test('inline edit save via Enter key', async ({ page }) => {
  await page.goto('/dashboard/workout/some-id/edit')

  await page.getByRole('button').filter({ has: page.locator('.lucide-pencil') }).click()
  await page.getByRole('textbox').fill('Keyboard Save')
  await page.getByRole('textbox').press('Enter')

  await expect(page.getByRole('heading', { level: 1, name: 'Keyboard Save' })).toBeVisible()
})
```

---

## Waiting Strategies

**Never** use `page.waitForTimeout()` — it's flaky and slow.
Use these instead:

```typescript
// ✅ Wait for navigation
await page.waitForURL('/dashboard')
await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)

// ✅ Wait for element to be visible
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

// ✅ Wait for element to disappear (e.g., loading state)
await expect(page.getByRole('button', { name: 'Creating…' })).not.toBeVisible()

// ✅ Wait for text to appear
await expect(page.getByText('No workouts logged for this date')).toBeVisible()
```

---

## Next.js Specific Patterns

### Testing Server Components
Server components render HTML — test their output like any other page:
```typescript
test('landing page renders feature cards', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Track Workouts' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Monitor Sets & Reps' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Review Progress' })).toBeVisible()
})
```

### Testing Client Components with State
```typescript
test('date picker changes dashboard date', async ({ page }) => {
  await page.goto('/dashboard?date=2026-03-15')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Open date picker and select a different date
  await page.getByRole('button', { name: /15th Mar/ }).click()
  // Select a day from the calendar popover
  // ...
})
```

### Testing Forms with Server Actions (this project's pattern)
```typescript
test('new workout form submits via Server Action', async ({ page }) => {
  await page.goto('/dashboard/workout/new')
  await page.getByLabel('Workout Name').fill('Push Day')
  await page.getByRole('button', { name: 'Create Workout' }).click()

  // Server Action processes and redirects
  await page.waitForURL(/\/dashboard\/workout\/.*\/edit/)
})
```

### Testing Protected Routes with Clerk
```typescript
// Unauthenticated users get redirected (Clerk middleware handles this)
test('protected route redirects to sign-in', async ({ page }) => {
  await page.goto('/dashboard')
  // Clerk handles redirect — page should NOT stay on /dashboard
  await expect(page).not.toHaveURL('/dashboard')
})
```

---

## Common Assertions Reference

```typescript
// Page/URL
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveURL(/dashboard/)
await expect(page).toHaveURL(/date=2026-03-15/)

// Element visibility
await expect(locator).toBeVisible()
await expect(locator).not.toBeVisible()
await expect(locator).toBeHidden()

// Text content
await expect(locator).toHaveText('Exact text')
await expect(locator).toContainText('partial text')
await expect(locator).toHaveText(/regex pattern/)

// Form state
await expect(locator).toHaveValue('Upper Body')
await expect(locator).toBeDisabled()
await expect(locator).toBeEnabled()

// Count
await expect(locator).toHaveCount(3)

// Attribute
await expect(locator).toHaveAttribute('href', /\/dashboard\/workout\//)
await expect(locator).toHaveClass(/active/)
```

---
name: playwright-e2e
description: |
  Automatically generate, update, and maintain Playwright E2E tests for this Next.js workout diary app.

  Trigger this skill whenever:
  - A new page, route, or component is created and needs E2E test coverage
  - Existing code (pages, components, Server Actions) is modified and related tests need updating
  - A user asks to "write e2e tests", "add playwright tests", "test this page", or "update tests"
  - Before a commit or PR and the user wants to check or fill test coverage gaps
  - A Playwright test is failing and needs diagnosis or repair
  - The user says things like "Create e2e tests", "Add e2e tests", "Check e2e tests before commit", "Update e2e tests for this change", "Fix failing e2e test", etc.

  Always use this skill for any Playwright-related task — even seemingly simple ones like
  "add a test for the workout form" — because proper selector strategy, test isolation,
  and file placement decisions require the full workflow in this skill.
---

# Playwright E2E Skill

Generate, update, and maintain Playwright E2E tests for this Next.js workout diary app.
Tests live in `e2e/` at the project root.

---

## Project Context

- **Framework**: Next.js 16 App Router, source under `src/app/`
- **Auth**: Clerk (modal-based sign-in/sign-up, no `/login` page)
- **Data mutations**: Server Actions (`actions.ts` files), NOT REST API routes
- **Existing auth fixture**: `e2e/fixtures/auth.ts` (Clerk Testing Tokens strategy)
- **Routes**:
  - `/` — Landing page: hero section, feature cards, Clerk sign-up CTA; redirects to `/dashboard` if authenticated
  - `/dashboard` — Workout list for selected date, date picker (Calendar popover), delete/duplicate workout dialogs, empty state
  - `/dashboard/settings` — Profile card (Clerk), connected accounts, theme switcher (Light/Dark/System), location & timezone form with Save
  - `/dashboard/workout/new` — Create workout form: name input, date/time picker, validation, `createWorkoutAction`
  - `/dashboard/workout/[workoutId]` — View mode: read-only workout detail with exercises and sets, "Edit Workout" link
  - `/dashboard/workout/[workoutId]/edit` — Edit mode: inline name editing, date/time editing, complete workout, exercise CRUD (add/remove/change via search popover), set CRUD (add/update/remove/duplicate)
- **Server Actions** (4 files, 15 actions):
  - `dashboard/actions.ts` — `deleteWorkoutAction`, `duplicateWorkoutAction`
  - `dashboard/workout/new/actions.ts` — `createWorkoutAction`
  - `dashboard/workout/[workoutId]/actions.ts` — `updateWorkoutAction`, `completeWorkoutAction`, `addExerciseToWorkoutAction`, `removeExerciseFromWorkoutAction`, `updateExerciseOnWorkoutAction`, `addSetAction`, `updateSetAction`, `removeSetAction`
  - `dashboard/settings/actions.ts` — `updateLocationSettingsAction`, `initializeSettingsAction`
- **Key UI components**: `DeleteWorkoutDialog` (confirmation modal), `DuplicateWorkoutDialog` (calendar date picker + success state), `WorkoutForm` (view/edit modes), `ExerciseCard`, `SetRow`

---

## Workflow Overview

There are three modes. Identify which applies, then follow that section:

1. **GENERATE** — New page/component, no existing test file
2. **UPDATE** — Existing code changed, test file exists
3. **COVERAGE CHECK** — Pre-commit/PR audit of what's tested vs. untested

---

## Mode 1: GENERATE — Create New Tests

### Step 1: Understand the feature

Read the source file(s) being tested. Identify:
- What **user actions** are possible? (clicks, form submissions, navigation)
- What **states** exist? (loading, error, empty, populated)
- What **URLs/routes** are involved?
- Is the page **protected** (calls `getAuthenticatedUser()`)?

### Step 2: Check project conventions

```bash
# Check existing test files for patterns to match
ls e2e/

# Check playwright config
cat playwright.config.ts

# Check existing auth fixture
cat e2e/fixtures/auth.ts
```

### Step 3: Determine test file location

```
e2e/
├── fixtures/       ← Auth setup, shared utilities
│   └── auth.ts     ← Clerk auth fixture (already exists)
├── pages/          ← Full page tests (routes)
│   ├── home.spec.ts
│   ├── dashboard.spec.ts
│   └── settings.spec.ts
├── flows/          ← Multi-step user journeys
│   ├── workout-flow.spec.ts
│   └── auth-flow.spec.ts
└── helpers/        ← Shared test data, utilities
    └── test-data.ts
```

### Step 4: Write the test file

Follow the patterns in `references/patterns.md`. Key rules:

**Import from auth fixture for protected routes:**
```typescript
import { test, expect } from '../fixtures/auth'
```

**Import from Playwright for public routes:**
```typescript
import { test, expect } from '@playwright/test'
```

**Selector priority (most → least preferred):**
1. `getByRole()` — most resilient, accessible
2. `getByLabel()` — for form fields
3. `getByText()` — for visible text
4. `data-testid` attribute — when semantic selectors aren't enough
5. CSS selectors — last resort only

**Test structure:**
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route')
  })

  test('should do X when user does Y', async ({ page }) => {
    // Arrange: set up state if needed
    // Act: perform user action
    // Assert: verify outcome
  })
})
```

**Always cover these scenarios for any page:**
- [ ] Happy path (main user journey succeeds)
- [ ] Empty state (if list/collection — e.g., "No workouts logged for this date")
- [ ] Error state (failed Server Action, validation errors)
- [ ] Authentication guard (if route calls `getAuthenticatedUser()`)

### Step 5: Validate the test runs

```bash
# Run just the new test file
npx playwright test e2e/pages/your-new-test.spec.ts

# If it fails, check the error and fix
npx playwright test e2e/pages/your-new-test.spec.ts --reporter=list
```

---

## Mode 2: UPDATE — Sync Tests with Code Changes

### Step 1: Identify what changed

```bash
# See what files changed
git diff --name-only HEAD~1 2>/dev/null || git status --short
```

### Step 2: Find related test files

```bash
# Search for tests referencing the changed component/page
grep -r "ComponentName\|/route-path" e2e/ 2>/dev/null
```

### Step 3: Diff source vs test

Read both the changed source file and its test file. Ask:
- Did any **selectors** change? (renamed elements, restructured DOM)
- Did any **routes** change? (URL changes, new params)
- Were **features added**? (new buttons, new states = new test cases needed)
- Were **features removed**? (delete obsolete test cases)
- Did **Server Action behavior** change? (update assertions)

### Step 4: Apply targeted updates

Make surgical edits — don't rewrite working tests. Update only:
- Broken selectors → new selector
- Changed routes → new URL
- New features → append new `test()` blocks
- Removed features → remove obsolete test cases

### Step 5: Verify

```bash
npx playwright test e2e/ --grep "Feature Name"
```

---

## Mode 3: COVERAGE CHECK — Pre-commit Audit

### Step 1: List all pages and routes

```bash
# Next.js App Router — source under src/app/
find src/app/ -name "page.tsx" | sort
```

### Step 2: List all existing test files

```bash
find e2e/ -name "*.spec.ts" 2>/dev/null | sort
```

### Step 3: Cross-reference and report

Build a coverage table:

| Route | Test File | Happy Path | Error State | Auth Guard | Status |
|-------|-----------|-----------|-------------|------------|--------|
| `/` | `e2e/pages/home.spec.ts` | ✅ | N/A | ✅ | ✅ Good |
| `/dashboard` | `e2e/pages/dashboard.spec.ts` | ✅ | ❌ | ✅ | ⚠️ Partial |
| `/dashboard/workout/new` | ❌ Missing | — | — | — | 🔴 No tests |

### Step 4: Prioritize and generate missing tests

Focus on:
1. 🔴 Pages with **zero** test coverage
2. ⚠️ Pages missing **auth guard** tests (security risk)
3. ⚠️ Pages missing **error state** tests (user experience)

Generate the highest-priority missing tests following Mode 1.

---

## Authentication Setup

This project uses **Clerk** with modal-based sign-in (no `/login` page).

The auth fixture at `e2e/fixtures/auth.ts` extends the base Playwright test.
Use **Clerk Testing Tokens** for E2E tests:

```bash
# .env.local (for E2E testing)
CLERK_TESTING_TOKEN=your_testing_token
```

```typescript
// In test files for protected routes:
import { test, expect } from '../fixtures/auth'

test('dashboard shows workouts', async ({ page }) => {
  await page.goto('/dashboard')  // auth handled by fixture
  // ...
})
```

For tests that verify **unauthenticated behavior**:
```typescript
import { test, expect } from '@playwright/test'

test('landing page shows hero for unauthenticated users', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your Personal Workout Diary' })).toBeVisible()
})
```

See `references/patterns.md` for the full Clerk auth fixture setup.

---

## Quality Checklist

Before finishing, verify each generated/updated test file:

- [ ] Tests use `getByRole` / `getByLabel` over CSS selectors where possible
- [ ] Each `test()` has a clear, readable description of what it tests
- [ ] Async operations use `await` (never fire-and-forget)
- [ ] No `page.waitForTimeout()` — use `waitForURL`, `waitForResponse`, or auto-waiting assertions
- [ ] Test data doesn't depend on production data or specific IDs
- [ ] Auth state is set up via the Clerk fixture, not duplicated in each test
- [ ] The test file actually runs without error (`npx playwright test <file>`)

---

## Reference Files

- `references/patterns.md` — Page Object Model, fixtures, Clerk auth, advanced patterns
- `references/examples/` — Complete working examples for this project's patterns
  - `auth-flow.spec.ts` — Clerk auth guard / protected route tests
  - `form-submission.spec.ts` — New workout form with validation + Server Action
  - `data-list.spec.ts` — Dashboard workout list with empty/populated states
  - `workout-edit.spec.ts` — Workout view/edit page: inline editing, exercises, sets, complete workout
  - `settings.spec.ts` — Settings page: profile, theme switcher, location/timezone form

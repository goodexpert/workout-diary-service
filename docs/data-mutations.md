# Data Mutations

## Overview

All data mutations in this application follow a strict layered architecture: **Server Action → Data Helper → Drizzle ORM**. This ensures consistency, type safety, and validation across the entire codebase.

## Data Helper Functions (`src/data/`)

All database writes (inserts, updates, deletes) MUST go through helper functions located in the `src/data/` directory. These helpers wrap Drizzle ORM calls and are the only layer that interacts with the database directly.

```ts
// src/data/workouts.ts
import db from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createWorkout(data: { name: string; userId: string }) {
  return db.insert(workouts).values(data).returning();
}

export async function deleteWorkout(id: string) {
  return db.delete(workouts).where(eq(workouts.id, id));
}
```

- Never call `db.insert`, `db.update`, or `db.delete` outside of `src/data/`.
- Each domain entity should have its own file (e.g., `src/data/workouts.ts`, `src/data/exercises.ts`).

## Server Actions (`actions.ts`)

All data mutations MUST be triggered via server actions defined in colocated `actions.ts` files next to the page or component that uses them.

```
src/app/workouts/
  page.tsx
  actions.ts       <-- server actions for this route
```

### Rules

1. **Every `actions.ts` file must start with `"use server";`.**
2. **Parameters must be explicitly typed** — do NOT use `FormData` as a parameter type.
3. **All arguments must be validated with Zod** before any data operation.
4. **Server actions call data helpers** — they never interact with Drizzle or the database directly.
5. **Never call `redirect()` inside a server action.** Redirects must be handled client-side after the server action call resolves (e.g., using `router.push()` in the calling component).

### Example

```ts
// src/app/workouts/actions.ts
"use server";

import { z } from "zod";
import { createWorkout } from "@/data/workouts";

const CreateWorkoutSchema = z.object({
  name: z.string().min(1),
  userId: z.string().uuid(),
});

export async function createWorkoutAction(params: {
  name: string;
  userId: string;
}) {
  const validated = CreateWorkoutSchema.parse(params);
  return createWorkout(validated);
}
```

## Summary of Rules

| Rule | Detail |
|------|--------|
| DB calls | Only in `src/data/` helper functions via Drizzle ORM |
| Mutations | Only via server actions in colocated `actions.ts` files |
| Server action params | Must be explicitly typed; never use `FormData` |
| Validation | All server action arguments validated with Zod |
| Direct DB access | Never allowed in server actions, components, or pages |
| Redirects | Never in server actions; handle client-side after the action resolves |

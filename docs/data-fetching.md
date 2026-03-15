# Data Fetching

## Core Rules

### Server Components Only

ALL data fetching in this app MUST be done via **Server Components**. No exceptions.

Do NOT fetch data via:

- Route handlers (`app/api/` routes)
- Client components (`"use client"` components)
- `useEffect`, `fetch` calls on the client, or any other client-side mechanism

Data flows from Server Components down to Client Components as props.

### Database Access via `/data` Helper Functions

All database queries MUST go through helper functions defined in the `/data` directory (e.g., `src/data/`). These functions:

- Use **Drizzle ORM** exclusively to query the database. **DO NOT USE RAW SQL** — no `sql\`...\``, no `db.execute("...")`, no template literal queries.
- Are the single point of access for all database operations.

### User Data Isolation

Every data helper function MUST scope queries to the currently authenticated user. A logged-in user can ONLY access their own data.

- Every query MUST include a `WHERE user_id = <currentUserId>` condition (or equivalent Drizzle filter).
- Never expose an endpoint or helper that allows fetching another user's data.
- Never trust a user-supplied `userId` parameter — always derive the user ID from the authenticated session on the server.
- Mutations (insert, update, delete) must also verify ownership before executing.

### Store in UTC, Display in Local

All dates follow a **"store UTC, display local"** strategy. Timestamps are persisted in UTC so the database has a single, unambiguous source of truth. The UI then converts to the user's local timezone for display.

#### Schema

- Every timestamp column MUST use `timestamp('col', { withTimezone: true })` in Drizzle. This maps to PostgreSQL `TIMESTAMPTZ`, which normalizes all incoming values to UTC on write and returns them in UTC on read.
- `new Date()` in `$onUpdate()` callbacks is safe — JavaScript `Date` objects are internally UTC, and Drizzle serializes them correctly for `TIMESTAMPTZ` columns.

#### Server-Side Queries

- Construct date boundaries with explicit UTC: append the `Z` suffix (e.g., `new Date('2025-03-14T00:00:00.000Z')`) and use UTC methods (`setUTCDate()`, `getUTCHours()`, etc.).
- **Never** use local timezone methods (`setHours()`, `setDate()`, `getDate()`) for query boundaries — these depend on the server's timezone and will produce incorrect results.

#### Passing Dates to Client Components

- Pass calendar dates as **strings** (`"yyyy-MM-dd"`) from Server Components to Client Components, not as `Date` objects.
- On the client, parse **without** the `Z` suffix (e.g., `new Date('2025-03-14T00:00:00')`) so the resulting `Date` is interpreted in the user's local timezone for display.

#### Displaying Dates

- Use `date-fns` `format()` for all date display. It formats in the browser's local timezone by default — no extra conversion needed.
- Follow the display format in `/docs/ui.md` (`"do MMM yyyy"`).

#### Examples

**User data isolation** — always scope queries to the authenticated user:

```ts
// src/data/workouts.ts
import db from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getWorkoutById(workoutId: string) {
  const user = await getAuthenticatedUser();

  // Always filter by BOTH workoutId AND userId
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)));

  return workout ?? null;
}
```

**UTC date boundaries** — use `Z` suffix and UTC methods for date-range queries:

```ts
// src/data/workouts.ts
import { and, eq, gte, lt } from "drizzle-orm";
import db from "@/db";
import { workouts } from "@/db/schema";
import { getAuthenticatedUser } from "@/lib/auth";

export async function getWorkoutsByDate(dateString: string) {
  const user = await getAuthenticatedUser();

  const dayStart = new Date(`${dateString}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateString}T00:00:00.000Z`);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, user.id),
      gte(workouts.startedAt, dayStart),
      lt(workouts.startedAt, dayEnd),
    ),
  });
}
```

**Server Component → Client Component** — pass dates as strings, fetch on the server:

```tsx
// src/app/dashboard/page.tsx (Server Component — no "use client")
import { format } from "date-fns";
import { getWorkoutsByDate } from "@/data/workouts";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage({ searchParams }) {
  const { date: dateParam } = await searchParams;
  const dateString = dateParam ?? format(new Date(), "yyyy-MM-dd");
  const workouts = await getWorkoutsByDate(dateString);

  return <DashboardClient dateString={dateString} workouts={workouts} />;
}
```

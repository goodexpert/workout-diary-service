# Routing

All application routes live under the Next.js App Router (`src/app/`). The app has two zones: a public landing page and a protected `/dashboard` area.

## Route Structure

| Route | Purpose | Protected |
|---|---|---|
| `/` | Public landing / marketing page | No |
| `/dashboard` | Main dashboard (workout list) | Yes |
| `/dashboard/workout/new` | Create a new workout | Yes |
| `/dashboard/workout/[workoutId]` | View workout details (readonly) | Yes |
| `/dashboard/workout/[workoutId]/edit` | Edit an existing workout | Yes |

## Rules

### All App Routes Live Under `/dashboard`

- Every authenticated feature page **must** be a sub-route of `/dashboard` (e.g., `/dashboard/workout/new`, `/dashboard/settings`).
- Do not create top-level routes outside of `/dashboard` for authenticated features. The only top-level route is `/` (the public landing page).

### Route Protection via Middleware

- All `/dashboard` routes are protected routes — they must only be accessible to logged-in users.
- Route protection is handled by the Next.js middleware (`src/middleware.ts`) using `clerkMiddleware()` from `@clerk/nextjs/server`. See `/docs/auth.md` for full auth details.
- In addition to middleware protection, every protected Server Component **must** call `getAuthenticatedUser()` from `src/lib/auth.ts` at the top of the component. This provides a server-side safety net and scopes data access to the current user.
- Do not implement route protection with client-side redirects or custom middleware logic — rely on the Clerk middleware and server-side `getAuthenticatedUser()` checks.

### Dynamic Routes

- Use Next.js dynamic route segments (e.g., `[workoutId]`) for entity-specific pages.
- The `params` prop in dynamic route pages is a `Promise` and must be awaited before accessing its values.
- Always validate that the requested entity exists after fetching — call `notFound()` from `next/navigation` if it does not.

### Navigation

- Use Next.js `<Link>` from `next/link` for all internal navigation.
- For programmatic navigation in Client Components, use `useRouter()` from `next/navigation`.
- Do not use `<a>` tags for internal links.

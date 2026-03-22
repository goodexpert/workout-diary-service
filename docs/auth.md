# Authentication

This app uses [Clerk](https://clerk.com/) for all authentication. Do not use any other auth library or roll custom auth logic.

## Setup

- `<ClerkProvider>` wraps the entire app in the root layout (`src/app/layout.tsx`).
- Clerk middleware (`src/middleware.ts`) runs on every request via `clerkMiddleware()`.
- Environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) must be set — never commit these values.

## Rules

### Server-Side Authentication

- Always retrieve the current user via the `getAuthenticatedUser()` helper in `src/lib/auth.ts`. Do not call `auth()` from `@clerk/nextjs/server` directly outside of this helper.
- `getAuthenticatedUser()` throws if no user is signed in — callers do not need to null-check the result.
- Every data helper function must call `getAuthenticatedUser()` and scope queries to the returned `user.id` (see `/docs/data-fetching.md`).

### Client-Side Components

- Custom auth pages replace Clerk's prebuilt UI:
  - `/sign-in` — Custom sign-in page using `useSignIn()` hook (email/password + Google/Apple OAuth)
  - `/sign-up` — Custom sign-up page using `useSignUp()` hook with email verification flow
  - SSO callback pages at `/sign-in/sso-callback` and `/sign-up/sso-callback` handle OAuth redirects via `AuthenticateWithRedirectCallback`
- The `<HeaderAuth />` component in the root layout handles signed-in/signed-out state:
  - Signed out: Links to `/sign-in` and `/sign-up`
  - Signed in: Avatar dropdown with Dashboard, Settings, and Sign Out
- Profile management is inline on the Settings page using `useUser()`:
  - Edit name via `user.update()`
  - Upload avatar via `user.setProfileImage()`
  - Change/set password via `user.updatePassword()` / `user.createPassword()`
  - Connect/disconnect OAuth accounts via `user.createExternalAccount()` / `account.destroy()`

### Route Protection

- Protect pages by calling `getAuthenticatedUser()` at the top of Server Components that require auth. The thrown error will surface Next.js's error boundary for unauthenticated visitors.
- Do not create custom middleware logic for route protection — rely on `clerkMiddleware()` and server-side checks.

### User Identity

- The user ID is the Clerk-issued `userId` string. This is the value stored in the database and used for all data isolation.
- Never trust a user-supplied ID — always derive identity from `getAuthenticatedUser()` on the server.

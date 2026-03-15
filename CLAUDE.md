# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start Next.js dev server with hot reload
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm test` — Run all Jest tests
- `npm run test:watch` — Jest in watch mode
- `npm run test:coverage` — Jest with coverage report
- To run a single test: `npx jest __tests__/filename.test.jsx`

## Code Generation Rules

- **ALWAYS** read and refer to the relevant docs file(s) in the `/docs` directory before generating any code. The docs contain specifications, design guidelines, and requirements that must be followed. If a relevant doc exists for the feature or area you are working on, its contents take precedence:

- /docs/auth.md
- /docs/data-fetching.md
- /docs/data-mutations.md
- /docs/routing.md
- /docs/server-components.md
- /docs/ui.md

## Architecture

- **Next.js 16 App Router** with all source code under `src/app/`
- **Tailwind CSS 4** via PostCSS (`@import "tailwindcss"` syntax, theme variables in `globals.css`)
- **Path alias**: `@/*` maps to `./src/*`
- **Testing**: Jest 30 + React Testing Library in jsdom environment; tests live in `__tests__/` at project root; `jest.setup.ts` auto-imports `@testing-library/jest-dom` matchers
- **ESLint 9** flat config extending `next/core-web-vitals` and TypeScript rules
- **TypeScript** in strict mode targeting ES2017

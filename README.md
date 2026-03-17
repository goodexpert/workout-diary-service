# Workout Diary Service

A web application for tracking workouts, exercises, and sets. Built with Next.js 16 App Router, backed by a PostgreSQL database.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via [Neon](https://neon.tech/) serverless driver
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: [Clerk](https://clerk.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Testing**: Jest 30 + React Testing Library
- **Linting**: ESLint 9

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (e.g. Neon)
- A Clerk account for authentication

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=your_postgresql_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Installation

```bash
npm install
```

### Database Setup

Generate and run migrations with Drizzle Kit:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start dev server with hot reload   |
| `npm run build`        | Production build                   |
| `npm start`            | Start production server            |
| `npm run lint`         | Run ESLint                         |
| `npm test`             | Run all tests                      |
| `npm run test:watch`   | Run tests in watch mode            |
| `npm run test:coverage`| Run tests with coverage report     |

## Features

- **Workout Tracking** — Create, view, edit, and delete workout sessions
- **Exercise & Set Logging** — Add exercises to workouts and log sets with weight and reps
- **Workout Duplication** — Copy a previous workout to a new date with all exercises and sets
- **Dashboard** — View workouts by date with calendar navigation
- **User Settings** — Timezone and location preferences with auto-detection
- **Dark/Light Theme** — Toggle between themes with system preference support
- **Authentication** — Clerk-based sign-in/sign-up with protected routes

## Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── dashboard/        # Authenticated dashboard & workout pages
│   │   ├── settings/     # User settings (timezone, location)
│   │   └── workout/      # Workout CRUD (new, view, edit)
│   ├── layout.tsx        # Root layout (Clerk, theme, header)
│   └── page.tsx          # Landing page
├── components/           # Shared React components
│   ├── theme-provider.tsx    # Next-themes dark/light mode
│   ├── theme-toggle.tsx      # Theme toggle button
│   ├── settings-initializer.tsx # Auto-initialize user settings
│   └── ui/               # shadcn/ui components
├── data/                 # Data access layer (Drizzle queries)
│   ├── workouts.ts       # Workout queries & mutations
│   ├── exercises.ts      # Exercise queries
│   ├── workout-exercises.ts # Workout-exercise operations
│   ├── sets.ts           # Set operations
│   └── user-settings.ts  # User settings operations
├── db/                   # Database connection & schema
└── lib/                  # Utilities (auth, helpers)
drizzle/                  # Migration files
__tests__/                # Jest test files
docs/                     # Coding standards & design docs
```

## Data Model

- **Workouts** — a named workout session with start/completion timestamps
- **Exercises** — exercise definitions (name, description)
- **Workout Exercises** — join table linking exercises to a workout with ordering
- **Sets** — individual sets within a workout exercise (weight, reps)
- **User Settings** — per-user preferences (timezone, country, city)

## License

GNU GENERAL PUBLIC LICENSE V3.0

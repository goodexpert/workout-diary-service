# UI Coding Standards

## Component Library

All UI components in this project **must** use [shadcn/ui](https://ui.shadcn.com/). No custom components should be created.

### Rules

- **Only shadcn/ui components are permitted.** Do not create custom UI components (buttons, inputs, dialogs, cards, tables, etc.).
- When a new UI element is needed, install the corresponding shadcn/ui component (`npx shadcn@latest add <component>`).
- If shadcn/ui does not offer a component for a specific need, compose existing shadcn/ui components together rather than building from scratch.
- Styling adjustments should be made via Tailwind CSS utility classes on shadcn/ui components, not by creating wrapper components.

## Date Formatting

All dates must be formatted using [date-fns](https://date-fns.org/).

### Format

Use the `format` function from `date-fns` with the pattern `do MMM yyyy`:

```ts
import { format } from "date-fns";

format(new Date(2025, 8, 1), "do MMM yyyy");  // "1st Sep 2025"
format(new Date(2025, 7, 2), "do MMM yyyy");  // "2nd Aug 2025"
format(new Date(2026, 0, 3), "do MMM yyyy");  // "3rd Jan 2026"
format(new Date(2024, 5, 4), "do MMM yyyy");  // "4th Jun 2024"
```

### Rules

- Always use `date-fns` for date formatting — do not use `Intl.DateTimeFormat`, `moment`, `dayjs`, or manual string concatenation.
- The standard display format is `do MMM yyyy` (ordinal day, abbreviated month, full year).

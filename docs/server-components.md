# Server Components

## Async Params and SearchParams

In Next.js 16, `params` and `searchParams` are **Promises** and **must be awaited** before use.

### Page Components

```tsx
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { query } = await searchParams;

  return <div>{id}</div>;
}
```

### Layout Components

```tsx
type LayoutProps = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export default async function Layout({ params, children }: LayoutProps) {
  const { id } = await params;

  return <div>{children}</div>;
}
```

### `generateMetadata`

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return { title: `Item ${id}` };
}
```

## Rules

- **Always** type `params` and `searchParams` as `Promise<...>`.
- **Always** `await` them before accessing properties.
- Never destructure `params` directly in the function signature — await first, then destructure.
- Page and layout components that receive `params` or `searchParams` must be `async` functions.

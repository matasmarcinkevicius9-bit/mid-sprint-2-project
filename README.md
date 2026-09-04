# Notes

A notes workspace built with Next.js and Supabase. Sign in, then create,
edit and delete notes, group them into collections, label them with tags,
and search across all of them at once.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Auth + row-level security) · TanStack Query

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in both values from your
Supabase dashboard under **Settings → API Keys**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your publishable / anon key>
```

Never put the service-role (secret) key in a `NEXT_PUBLIC_*` variable.

### 3. Set up the database

Run these in the Supabase **SQL Editor**, in order:

1. `supabase/schema.sql` — tables for notes, collections, tags
2. `supabase/002_add_auth.sql` — adds `user_id` and per-user RLS policies

### 4. Create a user

Supabase dashboard → **Authentication → Users → Add user**. Tick
**Auto Confirm User** so the account can sign in immediately.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## How auth works

- Supabase Auth handles sign-in and sessions. There is no custom password
  handling anywhere in this codebase.
- The session lives in **cookies** (via `@supabase/ssr`) so the server can
  read it on the request.
- `middleware.ts` verifies the user on every request to a protected route
  and redirects to `/signin` if there isn't one.
- `src/app/notes/page.tsx` verifies again on the server before rendering.
- Both use `getUser()`, which revalidates against the Supabase Auth server,
  rather than `getSession()`, which would trust whatever the browser sent.

Notes are scoped per user by row-level security in Postgres, not by
client-side filtering.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3000 |
| `npm run lint` | oxlint |
| `npm run typecheck` | TypeScript, no emit |

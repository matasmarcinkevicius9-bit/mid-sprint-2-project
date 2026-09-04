# CLAUDE.md

Guidance for working in this repository.

## What this project is

A notes workspace: a user signs in, then creates, edits and deletes notes.
Notes can be grouped into collections, labelled with tags, and filtered with
a search box that matches across every note at once.

## Stack

- **Next.js (App Router)** — routes live in `src/app`. Chosen over a
  client-only SPA specifically so the signed-in check can run on the server
  before a protected page renders.
- **React + TypeScript**
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Supabase** — Postgres for data, Supabase Auth for sign-in, row-level
  security for per-user scoping
- **@supabase/ssr** — keeps the session in cookies so the server can read it
- **TanStack Query** — client-side fetching, caching and mutations
- **oxlint** — linting

Dev server runs on **http://localhost:3000** (`npm run dev`).

## Authentication rules

These are hard requirements. Do not work around them.

1. **Supabase handles all sign-in and session handling.** Never hand-roll
   auth. There is no custom password hashing, comparison, storage or reset
   logic anywhere in this codebase, and none should be added.

2. **Verify the session on the server before any protected page loads.**
   Every signed-in-only route must be checked server-side before it
   renders — not hidden in the browser after the bundle loads. Two layers
   enforce this:
   - `middleware.ts` runs on every matching request and redirects to
     `/signin` when there is no valid user.
   - The protected page itself (`src/app/notes/page.tsx`) re-checks on the
     server and redirects, so the page cannot render for an
     unauthenticated visitor even if middleware were bypassed.

3. **Use `getUser()`, never `getSession()`, to decide whether someone is
   signed in.** `getSession()` reads whatever the browser sent and trusts
   it. `getUser()` revalidates the token against the Supabase Auth server,
   so a forged or stale cookie is rejected.

4. **Workspace routes require a signed-in user.** Anything under `/notes`
   is protected. Add new protected routes to `PROTECTED_PREFIXES` in
   `src/lib/supabase/middleware.ts`.

5. **No service-role key in client-accessible env vars.** Only
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   may be exposed to the browser. The service-role / secret key must never
   appear in a `NEXT_PUBLIC_*` variable, in client components, or in
   committed files. Row-level security is what protects the data, not key
   secrecy.

## Data rules

- **Supabase is the only persistence layer.** Note data must never be
  written to `localStorage` or `sessionStorage`. (The Supabase auth session
  cookie is managed by `@supabase/ssr` and is not note data.)
- **Every table is scoped by `user_id` with row-level security**, so a user
  can only ever read or write their own rows. Client code does not filter
  by user — the database does. New tables must enable RLS and add owner
  policies before being used.
- `user_id` defaults to `auth.uid()` at the database level, so inserts do
  not need to pass it explicitly.

## Layout

```
middleware.ts              server-side route protection
src/app/                   routes (signin, notes, auth/callback)
src/app/actions/           server actions (sign out)
src/components/            client UI components
src/hooks/                 TanStack Query hooks for notes/collections/tags
src/lib/supabase/          client / server / middleware Supabase clients
supabase/                  SQL migrations, run by hand in the SQL Editor
```

## Conventions

- Run `npm run typecheck`, `npm run lint` and `npm run build` before
  considering a change done.
- SQL changes go in a new numbered file under `supabase/` and are applied
  through the Supabase SQL Editor.

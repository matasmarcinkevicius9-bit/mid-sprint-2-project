# BAI.2.08 — Notes

A notes workspace built with Next.js and Supabase. Sign in, then create,
edit and delete notes, attach images to them, group them into collections,
label them with tags, and search across all of them at once.

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
3. `supabase/004_note_images.sql` — the `note_images` table and its policies
4. `supabase/005_note_images_storage.sql` — the private storage bucket and
   its access policies

Run them in that order. If step 4 is rejected on permissions, create the
bucket through the dashboard instead — the file's header comment has the
exact settings and policies.

(`003_comments_and_sharing.sql` is intentionally not applied; the comments
and sharing feature is not part of this app.)

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

### Registration

Sign-up is open in this project: the sign-up form and "Continue with
Google" both create an account on first use, rather than requiring one to
be made by hand in the Supabase dashboard. This is deliberate for a
personal project, and it is safe because row-level security scopes every
row to its owner, so a new account starts empty and can never read anyone
else's notes.

To restrict access to accounts created by hand instead, turn off
**Allow new users to sign up** in the Supabase dashboard under
Authentication. Note that this also disables the self-service sign-up
form.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3000 |
| `npm run lint` | oxlint |
| `npm run typecheck` | TypeScript, no emit |

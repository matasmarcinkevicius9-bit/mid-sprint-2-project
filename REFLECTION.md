# Reflection

## Choosing a persistence approach

### What I asked

Before settling on how notes should be stored, I consulted Claude Code on
the best option given the stack already in place: a React + TypeScript
front end talking to a Supabase project, with the hard constraint that no
note data may live in `localStorage` or `sessionStorage`, and that each
user must see only their own notes.

### What it recommended

Store notes in **Supabase Postgres, with row-level security (RLS) doing the
per-user scoping**, rather than filtering by user in client code.

The reasoning it gave:

- Supabase was already the backing store for the project, so adding a
  second persistence mechanism would mean two sources of truth to keep in
  sync.
- RLS enforces ownership in the database itself. Even if a bug in the front
  end forgot to filter by user, or someone called the REST API directly
  with the publishable key, Postgres would still refuse to return another
  user's rows. Client-side filtering gives the appearance of scoping
  without the guarantee.
- Putting `user_id` on each table with a default of `auth.uid()` means
  insert code never has to pass the user id, so it cannot be spoofed or
  forgotten.
- `localStorage`/`sessionStorage` were ruled out regardless: data there is
  per-browser, survives sign-out, is readable by any script on the origin,
  and would not survive the "sign in on another machine" case at all.

### How I evaluated it

I pushed on three points before accepting it.

**Is RLS actually doing the work, or is it decoration?** I tested this
rather than assuming. Querying the REST API directly with only the
publishable key returns an empty array — the key alone grants nothing,
because every policy is written as `auth.uid() = user_id`. That is the
behaviour I wanted: the key being public is not a leak, since the JWT is
what determines visibility.

**Where does the session live?** This turned out to be the consequential
part. The first version of the app kept the Supabase session in
`localStorage`, which is the default for a browser-only app. That is not
note data, so it did not break the storage rule, but it did make a genuine
server-side auth check impossible: a server cannot read `localStorage`. To
satisfy the requirement that the signed-in check happens on the server
before a protected page loads, the session had to move to **cookies** via
`@supabase/ssr`. That forced the move from a Vite SPA to Next.js, where
middleware and Server Components can read those cookies on the request.

**Is checking the session enough?** No. An earlier version used
`getSession()`, which just reads and trusts whatever the browser sent. I
replaced it with `getUser()`, which revalidates the token against the
Supabase Auth server. I verified the difference by planting a forged
session cookie: with `getUser()`, the server rejects it and redirects to
sign-in.

### What I chose, and why

**Supabase Postgres as the only persistence layer, with RLS scoping every
table by `user_id`, and the auth session held in cookies so the server can
verify it before rendering a protected page.**

Concretely:

- `notes`, `collections` and `tags` each carry a `user_id` that defaults to
  `auth.uid()`, and each has an owner-only RLS policy.
- No note data touches `localStorage` or `sessionStorage` anywhere.
- `middleware.ts` checks the user on every request to a protected route;
  `src/app/notes/page.tsx` checks again on the server before rendering.
- Both checks use `getUser()`, not `getSession()`.

### Alternatives I rejected

| Option | Why not |
| --- | --- |
| `localStorage` / `sessionStorage` | Explicitly forbidden by the brief, and rightly so: per-browser, survives sign-out, no cross-device access, readable by any script on the origin. |
| Filtering by `user_id` in client queries only | Looks identical in the UI but offers no real protection. Anyone calling the API directly would see every row. RLS makes the guarantee structural. |
| A separate custom backend in front of Supabase | Another service to write, run and secure, duplicating what RLS already does correctly. Not justified at this size. |
| IndexedDB for offline caching | Solves a problem this project does not have yet, and would reintroduce a second source of truth. Worth revisiting only if offline support is ever required. |

## What I would do differently

The costly mistake was building on a client-only SPA before reading the
auth requirement closely. "Verify the session on the server" is not a
detail that can be bolted on at the end — it determines where the session
is stored, which determines the framework. Had I started from that
constraint, the project would have been Next.js from the first commit
instead of migrating to it mid-sprint.

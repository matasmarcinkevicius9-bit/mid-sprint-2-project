# Reflection

> Fill in each section in your own words. Delete these quoted prompts as you
> go. There is a list of factual reminders at the bottom you can draw on —
> those are just notes about what the project actually does, not sentences to
> copy.

## 1. What I asked

> The brief said to consult Claude Code on the best persistence option
> *before* settling on one. What did you actually ask about, and what
> constraints did you give it? (Existing stack, no localStorage or
> sessionStorage, each user must only see their own notes.)

_Your answer here._

## 2. What it recommended

> Summarise the recommendation and the reasoning behind it. Aim for two or
> three sentences, not a transcript.

_Your answer here._

## 3. How I evaluated it

> This is the section markers care about most, because it shows judgement
> rather than acceptance. Some prompts:
>
> - Did you take the recommendation at face value, or test any part of it?
> - What convinced you it was right?
> - Was there anything you pushed back on, or that turned out to be more
>   involved than it first sounded?

_Your answer here._

## 4. What I chose, and why

> State the decision plainly, then the reasons. Be concrete about how user
> scoping is actually enforced, and where note data does and does not live.

_Your answer here._

## 5. Alternatives I rejected

> One line each on what you did not do and why. Suggested rows below — edit,
> cut, or add your own.

| Option | Why not |
| --- | --- |
| `localStorage` / `sessionStorage` | |
| Filtering by user in client-side queries only | |
| A custom backend in front of Supabase | |
| | |

## 6. What I would do differently

> Be honest here — a specific mistake and what it cost you reads far better
> than "I would manage my time better." Think about what you had to redo,
> and what you would have needed to know earlier to avoid it.

_Your answer here._

---

## Factual reminders

Notes about what this project actually does, to save you digging through the
code. Put them in your own words rather than lifting them.

**Stack.** Next.js (App Router), React, TypeScript, Tailwind CSS v4,
Supabase for both database and auth, TanStack Query for client-side data
fetching.

**Where notes live.** Every note, collection and tag is a row in Supabase
Postgres. Nothing is written to `localStorage` or `sessionStorage` — after
signing in and creating notes, both browser stores are completely empty.

**How per-user scoping works.** Each table has a `user_id` column that
defaults to `auth.uid()`, plus a row-level security policy of
`auth.uid() = user_id`. The client never filters by user; the database
refuses to return other people's rows. Verified by signing in as a second
account and seeing none of the first account's notes.

**Where the session lives, and why it matters.** The session is stored in
cookies via `@supabase/ssr`, not `localStorage`. This was the consequential
decision: a server cannot read `localStorage`, so the original browser-only
build could not satisfy "verify the session on the server before the page
loads." Moving the session into cookies is what made a server-side check
possible, and that is what forced the move from a Vite single-page app to
Next.js partway through the sprint.

**How the route protection is checked.** `middleware.ts` runs before a
protected page renders, and `src/app/notes/page.tsx` checks again on the
server. Both call `getUser()`, which revalidates the token against the
Supabase Auth server, rather than `getSession()`, which would trust whatever
the browser sent. Evidence: `curl` (which runs no JavaScript) gets a `307`
redirect to `/signin`, and so does a request carrying a forged session
cookie.

**Known caveat.** Signups are currently open in the Supabase project, so
Google sign-in and the sign-up page both create accounts automatically
rather than requiring an account made by hand in the dashboard.

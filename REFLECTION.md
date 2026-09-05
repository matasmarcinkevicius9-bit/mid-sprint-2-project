# Reflection

## Choosing a persistent-storage approach

I asked Claude Code to recommend a persistence layer for a React and
TypeScript app already pointed at Supabase, with two constraints:
`localStorage` and `sessionStorage` were ruled out, and each user had to
see only their own notes.

It recommended Supabase Postgres, with row-level security doing the
scoping rather than filtering by user in the client's queries.

That was the trade-off that mattered. Filtering in the query looks
identical in the interface but protects nothing: anyone calling the REST
API directly with the publishable key would still see every row. Row-level
security makes ownership a property of the database rather than a habit of
the front end.

I tested the claim rather than accepting it. Querying the REST endpoint
with only the publishable key returns an empty array, because every policy
reads `auth.uid() = user_id`. That convinced me the key being public is
not a leak. I chose Postgres with RLS, and `user_id` defaulting to
`auth.uid()` so insert code cannot forget or spoof it.

## A route-protection issue I caught and fixed

My project rules require the session to be verified on the server before a
protected page loads. Checking the auth code against that rule, I found
`useAuth` calling `supabase.auth.getSession()`. I had assumed that
confirmed whether someone was signed in. It does not: it reads the session
out of browser storage and trusts it, which is exactly the
browser-session-alone case the rule forbids.

I replaced it with `getUser()`, which revalidates the token against the
Supabase Auth server. To prove the difference I planted a forged session
cookie and reloaded: the server rejected it with a 403 and the app fell
back to the sign-in page. That fix also introduced a hang, since
`getUser()` throws on a malformed token and nothing caught it, so I
wrapped it to resolve to signed-out instead.

The deeper problem was structural. A browser-only app cannot satisfy this
rule at all, because a server cannot read `localStorage`. Moving the
session into cookies is what made a real server-side check possible, and
what forced the move to Next.js partway through the sprint.

## A prompt the agent misinterpreted

I asked for "a way for people to leave comments on a document", meaning a
comment box underneath a note.

It built that, plus an entire sharing subsystem: invitations by email, a
`security definer` Postgres function to resolve addresses to users, new
policies granting shared access, and a "Shared with me" view. The
reasoning was defensible, since notes are private and nobody else can
comment on one without being granted access, but it was far more than I
asked for and none of it was in the brief.

I redirected by scoping it out, telling it to drop comments and sharing
from this sprint and keep only what the brief grades. The feature had
never worked anyway, because its migration was never applied. The lesson
is to state the boundary in the prompt, not only the goal.

---
description: Run the Supabase, Next.js and Vercel security scanners in parallel on only the files changed on this branch, and merge their findings into one report
allowed-tools: Agent, Read, Grep, Glob, Bash(git branch --show-current), Bash(git merge-base:*), Bash(git diff --name-status:*), Bash(git ls-files --others --exclude-standard:*)
---

Run a read-only security scan of only the files changed on the current git
branch, using the three security subagents, then merge their results into
one report.

## Rule: report only

This command and every scanner it starts must not change anything. Do not
create, edit, move or delete files, run state-changing git commands, run
SQL that writes or alters anything, or apply migrations. Do not offer
fixes as edits at the end; only describe them in the report. If a scanner
says it needs write access to check something, list that under
**Could not check** instead.

## Step 1: find the changed files

Run these commands, replacing `<base>` with the commit the second one prints:

1. `git branch --show-current`
2. `git merge-base main HEAD`
3. `git diff --name-status <base> -- . ":(exclude).agents"`
4. `git ls-files --others --exclude-standard -- . ":(exclude).agents"`

Comparing against the merge base leaves out commits that landed on `main`
after this branch split off, since this branch did not make those changes.
`.agents/` is excluded because it holds hundreds of vendored skill files
that are not part of the app. The Summary must say it was excluded.

The changed files are the output of commands 3 and 4 together. That covers
this branch's commits plus uncommitted and untracked work. Keep each file's
status, and mark untracked files as `??`. Deleted files stay in the list:
removing a policy or a check can itself be a security problem, and scanners
can read the old version with `git show <base>:<path>`.

If `git merge-base` fails, stop and report that `main` could not be found.
If the list is empty, report that there is nothing to scan and stop. Do not
start the scanners in either case.

## Step 2: dispatch all three scanners at once

In a **single message**, make three Agent tool calls so they run in
parallel, not one after another:

- `subagent_type: supabase-security-scanner`
- `subagent_type: nextjs-security-scanner`
- `subagent_type: vercel-security-scanner`

Give each one the same prompt, with the full file list and `<base>` filled in:

> Run a read-only security audit limited to the files below, which changed
> on this branch compared to `main` (merge base `<base>`). Report only
> problems in these files or caused by these changes. Do not scan the rest
> of the codebase. You may read an unchanged file only when you need it to
> judge a changed one, such as an older migration or a helper that a changed
> file calls. Use `git diff <base> -- <path>` to see what changed. Apply only
> the checks from your own instructions that relate to these files, including
> any live probe needed to confirm a finding in them. If none of the files are
> in your area, say so and stop. List checks you skipped because they fall
> outside these files under **Could not check**. Return your report in your
> own format and change nothing.
>
> Changed files:
> `<status and path, one per line>`

Wait until all three have reported before going further. Do not start
merging from partial results, and do not guess what a scanner that has
not finished will say. If a scanner fails or returns nothing, say so in
the final report and merge the other two.

## Step 3: merge into one report

Combine the three reports into one, grouped by severity in this order:

1. **Critical**
2. **High**
3. **Medium**
4. **Low**

Keep each scanner's severity for its finding. The Supabase scanner has no
Low tier, so its findings stay where it placed them.

**De-duplicate.** Two findings are the same when they describe the same
underlying problem in the same place (same file/line, table, policy, env
var, header or setting), even if worded differently. List each such
problem once:

- use the clearest title and the most complete description of the
  impact and fix from the duplicates
- if the scanners disagree on severity, file it under the highest one
  and note the disagreement
- end the finding with `Flagged by:` and the scanner names, e.g.
  `Flagged by: supabase-security-scanner, nextjs-security-scanner`

Findings only one scanner raised still get a `Flagged by:` line naming
that scanner.

For each finding give:

- a one-line title
- where it is (`file:line`, table, setting or URL)
- the impact: what a real attacker could do
- the suggested fix
- how it was found (read in code, or confirmed by a live probe)
- `Flagged by:` as above

## Report layout

Start with a short **Summary**: the branch and merge base, the number of
changed files, the count of findings at each severity, which scanners ran,
which scanners had no changed files in their area, and any severity heading
that has no findings (leave the empty heading itself out). State that this
scan covers only the changed files, so it does not show that the rest of the
project is secure.

Then the four severity sections, then:

- **Changed files scanned**: the list from Step 1
- **Checked and passed**: the scanners' passed checks, merged and
  de-duplicated
- **Could not check**: everything any scanner lacked access to or skipped,
  with the scanner name

Do not add generic advice the scanners did not raise.

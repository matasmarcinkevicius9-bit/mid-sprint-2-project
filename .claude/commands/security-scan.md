---
description: Run the Supabase, Next.js and Vercel security scanners in parallel and merge their findings into one report
argument-hint: "[optional focus, e.g. a branch, file or area]"
allowed-tools: Agent, Read, Grep, Glob
---

Run a full read-only security scan of this project using the three
security subagents, then merge their results into one report.

Optional focus from the user: $ARGUMENTS

## Rule: report only

This command and every scanner it starts must not change anything. Do not
create, edit, move or delete files, run state-changing git commands, run
SQL that writes or alters anything, or apply migrations. Do not offer
fixes as edits at the end; only describe them in the report. If a scanner
says it needs write access to check something, list that under
**Could not check** instead.

## Step 1: dispatch all three scanners at once

In a **single message**, make three Agent tool calls so they run in
parallel, not one after another:

- `subagent_type: supabase-security-scanner`
- `subagent_type: nextjs-security-scanner`
- `subagent_type: vercel-security-scanner`

Give each one the same prompt: run your full read-only audit of this
project following your own instructions, return your complete report in
your own format, and change nothing. If the user passed a focus above,
include it in each prompt.

Wait until all three have reported before going further. Do not start
merging from partial results, and do not guess what a scanner that has
not finished will say. If a scanner fails or returns nothing, say so in
the final report and merge the other two.

## Step 2: merge into one report

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

Start with a short **Summary**: the count of findings at each severity,
which scanners ran, and any severity heading that has no findings (leave
the empty heading itself out).

Then the four severity sections, then:

- **Checked and passed**: the scanners' passed checks, merged and
  de-duplicated
- **Could not check**: everything any scanner lacked access to, with the
  scanner name

Do not add generic advice the scanners did not raise.

---
name: pr-fix-angles
description: Parallel disjoint-lane fix campaign — the execution companion to pr-audit-angles. Takes a set of verified findings and fixes ALL of them across multiple subagents that edit IN PARALLEL without merge conflicts, by partitioning the findings into lanes of exclusive file ownership. A lane whose findings share a file runs as sequential stages; independent lanes run concurrently. Each agent returns a structured completed/deferred/tests report; the orchestrator owns the single final lint→build→test gate and never commits without you. Use after an audit ("fix all the findings", "patch everything blocker→minor", "make it merge-ready"), or for any many-file coordinated remediation. Triggers on "fix all findings", "fix campaign", "remediate the PR".
user-invocable: true
context: fork
allowed-tools:
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - Bash(git:*)
  - Bash(gh:*)
  - Task
---

# PR Fix — Parallel Disjoint-Lane Remediation

The *execution* arm: take a set of **verified** findings and fix them all, fast, by running multiple subagents in parallel — safely, because their file sets never overlap.

Pairs with **`pr-audit-angles`** (the *find* arm, which produces the verified findings). Verify before you fix: spending agents on phantom or already-closed findings is the main failure mode.

## When to invoke

- You hold verified findings (from `pr-audit-angles`, bot review, or your own pass) and want them all fixed in one push.
- The remediation spans **several files across 2+ subsystems** — enough that serial fixing is slow and naive parallel fixing would corrupt the tree.

**Skip** for: a 1–3 file fix (just do it inline with a failing test first), or when findings are unverified — verify first so you don't fix non-bugs.

## The core idea: lanes of exclusive file ownership

Two agents editing the same file at the same time corrupt each other. So **partition the findings into lanes whose file sets are disjoint.** Then:

- **Independent lanes run fully in parallel.**
- **A lane whose findings all touch one hot file** runs as **sequential stages within that lane** (thread each stage's result into the next), while the other lanes run alongside it.

```
parallel([
  laneA = stage1 → (thread result) → stage2 → ...   // shared hot file: serial stages
  laneB,                                              // disjoint files: concurrent
  laneC,
])
→ orchestrator runs the ONE final lint → build → test gate
→ report; do NOT commit unless the user asks
```

## Recipe

1. **Group findings into lanes by the files they touch.** Draw boundaries so file sets are disjoint. Two findings that must edit the same file go in the *same* lane (as stages), never in two parallel lanes.
2. **Warm the build once before dispatching** (if the repo has a build/compile step). Parallel agents that compile/test on a cold tree can race on shared build outputs.
3. **Give every lane the shared binding-rules preamble** (below) + its lane-specific section: exclusive file list, forbidden files, required reading, and the per-finding fix spec.
4. **Force structured output** (`completed` / `deferred` / `testsRun` / `filesTouched` / `notes`) so you merge results mechanically — see `EXAMPLES.md`.
5. **Within a shared-file lane, thread context:** pass stage 1's result JSON into stage 2's prompt ("STAGE-1 RESULT, already applied to the tree: …") so the next stage edits current state, not the base.
6. **The orchestrator owns the gates.** After all lanes return, *you* run the repo's full lint → build → test. Agents never run the full suite.
7. **Report, then stop.** Summarize completed/deferred per lane and the gate result. **Never commit or stage** without an explicit request — and when asked, stage explicit paths, never a blanket `git add -A` (it sweeps in unrelated working-tree files).

## The shared lane preamble (binding rules, verbatim into every lane)

```
You are one lane of a coordinated fix campaign on <PR/branch>. The tree is checked out and clean; the
build is already warm. A verified-findings audit produced the items below; you fix YOUR lane's findings.

HARD RULES:
- Use the repo's own commands (from package.json / Makefile / CI). For focused iteration, run only the
  narrowest test selection for the files you touched — NEVER the full suite (the orchestrator owns that).
- Bug fixes use a failing test FIRST: write it, run it, OBSERVE it fail (proves it catches the bug), then
  fix, then re-run green. Never weaken an assertion to make a test pass.
- Zero new warnings in files you touch. Fix the root cause; never reshape code just to dodge a lint/guard
  rule — the rule is a proxy for an intent, so satisfy the intent.
- Follow THIS repo's conventions (read the required docs/configs below); do not import patterns from elsewhere.
- NEVER assume the shape of an artifact you depend on — read the authoritative source (schema, type, an
  existing call site) before writing code against it.
- Do NOT git add/commit/stage anything. Leave all changes in the working tree.
- LANE DISCIPLINE: edit ONLY the files listed for your lane. Other lanes run in parallel on disjoint files;
  touching an out-of-lane file causes merge corruption. If a correct fix genuinely needs an out-of-lane
  file, DO NOT edit it — record it in `deferred` with the exact change needed.
- Cite file:line in every `completed` entry. Your structured output is consumed by the orchestrator.
```

## Per-finding fix spec — hand the agent the failing test, don't delegate "TDD it"

The biggest quality lever: write the **failing-test design into the prompt**. Don't say "fix the bug, TDD it" — specify:

- **RED:** the exact setup/seeding, the exact failure to observe, and a **fallback** if the harness can't reproduce it ("if the test can't trigger X, assert the underlying state instead and say so in `notes`").
- **GREEN:** the fix direction + the existing pattern/function to route through ("reuse `<helper>` at `<file:line>` — read its signature first") and the invariants to preserve.
- **VERIFY:** the exact narrow test command, and "report every test you added by name."

For each fix also give: **YOUR FILES (exclusive lock)**, **FORBIDDEN** (files another lane owns), and **READ FIRST** (the 2–4 docs + exemplar `file:line` that define the established pattern).

## Schema & contract safety inside a lane

- If a fix needs a schema/migration change, make that **one lane's exclusive job**; require the repo's migration/codegen step so generated artifacts stay in sync. Other lanes must not touch those generated files.
- **Freeze shared wire contracts** for the campaign unless a finding is explicitly about them: "do NOT add/rename/renumber the enum members / DTO fields — the contract is frozen; if a change seems unavoidable, `defer` it with your design." This stops two lanes diverging a shared contract.

## Pre-step: verify findings before fixing (find → adversarially verify)

If the findings aren't already verified, run that first: candidate-finders emit findings → **one skeptical verifier per finding** ("Adversarially VERIFY against current code. Default to 'not real' unless you can prove it with file:line. Check whether a recent commit already closed it."). Keep only `isReal && reachable && !alreadyFixed`. This is "a review is a lead, not a verdict" mechanized — it stops the campaign burning agents on phantom or already-closed findings. `pr-audit-angles` already does this in its synthesis; reuse its output when you have it.

## Common pitfalls

- **Overlapping lanes** → merge corruption. If two parallel lanes list the same file, re-partition or merge them into one staged lane.
- **Wrong parallelism** — shared hot file ⇒ sequential stages; disjoint files ⇒ concurrent. Don't barrier disjoint lanes.
- **Weak-model dispatch** — subtle invariants need your most capable model; a cheaper tier wastes a round-trip.
- **Agents running the full suite or committing** — both are the orchestrator's job; agents use narrow test selections and leave the tree dirty.
- **Weakening an assertion to go green** — if a test exposes a bug, fix the bug.
- **Committing unasked, or `git add -A`** — stage explicit paths, only on request.

See `EXAMPLES.md` for a ready-to-adapt orchestration script (disjoint lanes + sequential stages + the fix schema).

## Triggering

```
/pr-fix-angles                 # fix the verified findings for the current branch
/pr-fix-angles <PR#>           # fix findings for a specific PR
```

Or naturally: "fix all the audit findings, blocker to minor", "patch everything and make it merge-ready", "run a fix campaign on this PR". Typically chained right after `pr-audit-angles`.

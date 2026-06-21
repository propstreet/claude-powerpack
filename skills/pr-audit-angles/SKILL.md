---
name: pr-audit-angles
description: Multi-angle parallel audit of a large PR or branch before merge. Dispatches one capable subagent per angle (matched to the changed surface), each anchored to the repo's own conventions and producing a uniform Blockers / Important / New-concepts-verdict / Verified-clean report; the orchestrator verifies every candidate against current code and synthesizes one merge-readiness verdict. Use when a PR spans multiple subsystems, when you worry it introduces new concepts where patterns already exist, or when asked to "audit before merge", "review from every angle", "is this safe to merge".
user-invocable: true
context: fork
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git:*)
  - Bash(gh:*)
  - Agent
---

# PR Audit — Multi-Angle Parallel Review

Audit a large change by splitting it into independent **angles**, giving each angle its own subagent, and having the orchestrator verify and synthesize. One careful reviewer can't hold a 50-file, multi-subsystem diff in working memory at once; N focused reviewers can, in parallel, in a few minutes of wall-clock.

This is the *find* half of a pair. Its execution companion is **`pr-fix-angles`**, which fixes the verified findings across parallel disjoint-file lanes.

## When to invoke

- `git diff --stat <base>...HEAD` shows a large change: many files, or >2 subsystem boundaries (e.g. services + DB + frontend + tests).
- You want an independent pattern-conformance pass — "are we introducing new concepts where an established pattern exists?"
- A bot-review-heavy PR where you want each bot claim independently verified.
- After merging the base branch in, when the branch may have drifted from current conventions.

**Skip** for: single-file fixes, doc-only PRs, dependency bumps, or anything touching fewer than ~3 subsystems — just review inline.

## Step 0 — discover the repo's conventions (don't assume)

The audit is only as good as what each angle is anchored to. Before dispatching, gather **this repo's** standards so angles compare against the real conventions, not generic best practice:

- Contributor/agent guidance: `CONTRIBUTING*`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `docs/**`, architecture notes.
- Enforced rules: linter/formatter configs, type-checker settings, CI workflow files, pre-commit hooks, custom lint rules.
- The repo's own commands: read `package.json` scripts / `Makefile` / `justfile` / CI steps to learn how this project lints, builds, and tests (don't hardcode a tool).
- Exemplars: for each subsystem, 2–3 existing files that show "the established way."

## The pattern

```
1. Scope         → git log + git diff --stat; read the PR body (gh pr view) if there is one
2. Pick angles   → match angles to the changed surface; skip angles with zero file touches
3. Dispatch      → one capable subagent per angle, IN PARALLEL, each with the 6-section prompt below
4. Verify        → re-check every candidate blocker/important against current code before believing it
5. Synthesise    → one unified merge-readiness report with only verified findings
```

**Do** dispatch in parallel; **don't** sequence the angles. **Do** dispatch your most capable model and a general-purpose (file-reading) agent type — a cheaper/smaller tier or a shallow-search agent misses subtle invariants and wastes a round-trip. **Don't** let angle agents run the full test suite — it's slow and exhausts their budget; the orchestrator owns the gates.

A subagent's report is a **lead, not a verdict.** Treat every blocker/important item as a candidate claim until the orchestrator verifies it against current files, docs, tests, generated artifacts, or framework behavior. Never forward an unverified subagent allegation as a finding.

## Picking angles

Derive angles from the changed surface and the repo's subsystems. A useful default set (drop any with zero touched files, add repo-specific ones):

| Angle | Looks for |
| --- | --- |
| Backend / core logic | correctness, error/null handling, async/concurrency, data-access patterns, logging conventions |
| Data / schema / migrations | schema-change safety, query shape, index correctness, reversibility, snapshot consistency |
| API / wire contract | request/response shape, validation, status codes, versioning/compat, serialization |
| Frontend / UI | framework idioms, state/reactivity rules, accessibility, component reuse, design-system use |
| Authorization / data ownership | tenant/ACL scoping, access tiers, no cross-boundary leaks, every new endpoint gated like its neighbours |
| Async / jobs / events | idempotency, ordering, retry/concurrency attributes, audience targeting, fire-and-forget vs awaited |
| i18n / terminology / naming | string placement, locale completeness, product/domain voice, no internal/vendor names on user surfaces |
| Tests | fixture/pattern conformance, assertion strength (no weakened asserts), coverage gaps per new behavior |
| **Completeness / parity** | a feature added to *one* of a sibling pair (two projections, single/batch tools, two DTOs, multiple read paths) but not the other — "is it *whole*", not "is it correct". The angle a correctness/ACL pass reliably misses. |

## Agent prompt template (6 sections)

Every angle agent gets the same shape. Mid-flight wandering happens when one section is missing.

1. **Required reading first** — the 2–4 docs/configs the agent must read before the diff, so it flags real violations, not pseudo-violations against patterns that aren't the convention here.
2. **In-scope files** — concrete paths, read **fully**, not just the hunks (`git diff <base>...HEAD -- <glob>` to scope).
3. **Comparison anchors** — 2–3 exemplar files that embody "the established way" for this angle. Compare against these, not generic best practice.
4. **What to flag** — a numbered checklist of the repo's hard rules for this angle. Agents follow checklists better than vibes.
5. **New concepts to challenge** — name each new thing the PR introduces and demand a verdict: justified-because-X / should-reuse-existing-pattern-at-Y / duplicate-of-Z. This is the load-bearing section for the "new concepts vs existing patterns" worry.
6. **Output format** — the uniform structure below, with an evidence requirement ("'looks good' without a file:line citation is not acceptable") and a "candidate findings require orchestrator verification" guardrail. Forcing **structured output** (a findings schema) lets you merge results mechanically instead of re-reading each transcript — see `EXAMPLES.md`.

Also pre-load an **"intentional design decisions — do NOT flag these"** list so known false positives are never generated.

## Uniform output every angle produces

```markdown
## <Angle> Audit
### Blockers (must-fix before merge)
- [path:line] what's wrong + the correct pattern (doc section or exemplar file:line)
  - Evidence checked: <file/doc/test/framework source> · Status: candidate (orchestrator must verify)
### Important (should-fix)
- ...
### New concepts verdict
- ConceptName: Justified | Should reuse pattern at path:line | Duplicate-of-X
### Verified clean
- <hard-rule scan>: <result + one-line evidence with file:line>
```

## Synthesis (orchestrator only)

1. **Verify before reporting.** For each candidate, read the current code and at least one contract source (docs, tests, generated schema, framework behavior). Classify: `confirmed` / `stale-superseded` / `false` / `policy question` / `cleanup only`. Only `confirmed` items become findings.
2. **Cross-referenced duplicates** (same item from 2+ angles) are a reason to verify carefully, not automatic truth.
3. **New-concepts table** — one row per challenged concept with a one-line verdict; this is what the reviewer most wants to skim.
4. **0 blockers ≠ rubber-stamp** — include a "Verified clean" highlights section so the breadth of what was checked is visible.
5. **Cite file:line everywhere** — synthesis loses its value if it drops the citations the agents provided.

**After synthesis:** hand the verified findings to **`pr-fix-angles`** to remediate them in parallel.

## Common pitfalls

- **Weak/shallow agent dispatch** — a cheaper model tier or an excerpt-only search agent misses subtleties and wastes a round-trip. Use the most capable model and a full-file-reading agent type.
- **Full test suite inside angle agents** — slow, budget-exhausting; the orchestrator owns the gates.
- **Laundering subagent claims into findings** — subagents miss hidden repo context; verify every candidate first.
- **Trusting the PR body** — descriptions drift from code on long branches; verify code, not prose.
- **Skipping the new-concepts section** — without "justified or reuse X?" framing, agents default to "looks reasonable" and miss the actual worry.

See `EXAMPLES.md` for a ready-to-adapt parallel-orchestration script with structured finding/verdict schemas.

## Triggering

```
/pr-audit-angles                 # audit current branch vs the default base
/pr-audit-angles <branch|PR#>    # audit a specific branch or PR
```

Or naturally: "audit this PR before I merge", "review the branch from every angle", "am I introducing new concepts where patterns exist?".

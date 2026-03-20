---
name: mine-history
description: Extract and synthesize learnings from past Claude Code session transcripts into project documentation. Use when asked to "mine history", "extract learnings from past sessions", "what patterns keep recurring", or "improve docs from history".
user-invocable: true
argument-hint: "[--since-days=90] [--max-pairs=500]"
allowed-tools:
  - Bash(node:*)
  - Bash(wc:*)
  - Bash(head:*)
  - Bash(cat:*)
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

# Mine Session History

Extract actionable learnings from past Claude Code conversations and synthesize them into project documentation. Turns the goldmine of corrections, mandates, and discoveries across all sessions into persistent knowledge.

$ARGUMENTS

## Phase 1: Extract Raw Corrections

Run the extraction script to scan all session transcripts for user corrections:

```bash
node scripts/extract-learnings.js \
  --project=. \
  --output=/tmp/learnings-raw.md \
  --since-days=90 \
  --max-pairs=500
```

Adjust `--since-days` and `--max-pairs` based on user arguments.

Read the output file to understand what was extracted.

## Phase 2: Audit Existing Documentation

Before proposing any changes, read ALL existing documentation to understand what's already captured — CLAUDE.md, docs/*.md, .claude/rules/. Build a mental map of what's already documented.

## Phase 3: Synthesize & Deduplicate

Work through the extracted corrections by topic:

| Check | Action |
|-------|--------|
| Already documented? | Skip — note as "confirmed" |
| Contradicts existing docs? | Flag for review |
| Genuinely new pattern? | Propose addition |
| Session-specific (not generalizable)? | Skip |
| Single occurrence (might be wrong)? | Skip unless obviously correct |

**Quality filter — only propose learnings that:**
- Appear multiple times across sessions (pattern, not one-off)
- OR are clearly universal (e.g., "never use DateTime.UtcNow")
- Would prevent a real mistake if documented
- Are concise enough for a one-liner or short paragraph

**Route by category:**

| Category | Target File |
|----------|------------|
| Universal rule | CLAUDE.md (if under 300 lines) |
| Domain-specific pattern | Appropriate docs/*.md file |
| Path-scoped convention | .claude/rules/{topic}.md |
| Tool/workflow preference | CLAUDE.md or docs/DEVELOPMENT_PRACTICES.md |

## Phase 4: Present Proposals

Present ALL proposed changes in a single summary before writing anything:

```markdown
## History Mining Results

### Statistics
- Sessions scanned: X
- Corrections found: Y
- Already documented: Z
- New learnings: N

### Proposed Updates

#### 1. docs/FRONTEND.md
- **Add to Reactivity section**: "Never unwrap .value in addToast() calls — refs stay reactive"

#### 2. Skipped (already documented)
- "Use npm run scripts" — in CLAUDE.md line 12
```

## Phase 5: Apply with Approval

Use AskUserQuestion to get approval before writing. Options: apply all, let me pick, save proposals to file, or skip.

After applying, show a summary table with file, change description, and line delta.

## Gotchas

- Never add session-specific context — "We fixed bug #42" is not a learning
- Prefer updating over adding — extend existing bullets, don't create new sections
- One-liners only for CLAUDE.md — it has a 300-line budget
- Route domain knowledge to docs/*.md — that's where detailed patterns belong
- Don't duplicate linter rules — if the toolchain enforces it, don't document it
- Multiple occurrences = high confidence — a pattern seen across 3+ sessions is almost certainly worth documenting
- Single occurrence = verify first — read the surrounding context before proposing

---
name: mine-history
description: Extract and synthesize learnings from past Claude Code session transcripts into project documentation. Use when asked to "mine history", "extract learnings from past sessions", "what patterns keep recurring", or "improve docs from history".
user-invocable: true
argument-hint: "[--since-days=90] [--max-pairs=500]"
allowed-tools:
  - Bash(node:*scripts/extract-learnings.js*)
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
node {SKILL_DIR}/scripts/extract-learnings.js \
  --project="$(pwd)" \
  --output="/tmp/learnings-raw.md" \
  --since-days=90 \
  --max-pairs=500
```

**Adjust flags based on user arguments** — pass `--since-days` and `--max-pairs` if specified.

Read the output file to understand what was extracted.

## Phase 2: Audit Existing Documentation

Before proposing any changes, read ALL existing documentation to understand what's already captured:

1. **Read CLAUDE.md** — the root project instructions
2. **Scan docs/*.md** — all project documentation files
3. **Scan .claude/rules/** — any existing rule files

Build a mental map of what's already documented.

## Phase 3: Synthesize & Deduplicate

Work through the extracted corrections by topic. For each correction:

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

**Categorize each learning by destination:**

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
- **Add to Testing section**: "Use vi.waitFor() not flushWithTimers() for complex async chains"

#### 2. docs/DATABASE.md
- **Add to Query Patterns**: "Use OfType<T>() cast pattern, not direct property access through base type"

#### 3. Skipped (already documented)
- "Use npm run scripts" — in CLAUDE.md line 12
- "Never use storeToRefs" — in CLAUDE.md line 143
```

## Phase 5: Apply with Approval

Use AskUserQuestion to get approval before writing:

```
Options:
- Apply all
- Let me pick (show each individually)
- Save proposals to file (review later)
- Skip
```

After applying, show a summary table:

| File | Change | Lines |
|------|--------|-------|
| docs/FRONTEND.md | Added 3 patterns to Reactivity section | +6 |
| docs/DATABASE.md | Added query cast pattern | +3 |

## Important Guidelines

- **Never add session-specific context** — "We fixed bug #42" is not a learning
- **Prefer updating over adding** — extend existing bullets, don't create new sections
- **One-liners only for CLAUDE.md** — it has a 300-line budget
- **Route domain knowledge to docs/*.md** — that's where detailed patterns belong
- **Don't duplicate linter rules** — if the toolchain enforces it, don't document it
- **Respect the correction pair** — the user's words are the authoritative source
- **Multiple occurrences = high confidence** — a pattern seen across 3+ sessions is almost certainly worth documenting
- **Single occurrence = verify first** — read the surrounding context before proposing

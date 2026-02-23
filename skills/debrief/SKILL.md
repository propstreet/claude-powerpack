---
name: debrief
description: Capture session learnings and update project docs. Use when ending a session, after completing a feature, or when asked to "debrief", "capture learnings", "update project knowledge", or "what did we learn".
user-invocable: true
allowed-tools:
  # Git: read-only operations
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(git status)
  - Bash(git show:*)
  - Bash(git ls-files:*)
  # File operations
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

# Session Debrief

Capture learnings from the current session and persist them into project documentation. The goal is continuous improvement: never repeat the same mistakes, always build on what we learn.

## When to Use This Skill

- End of a coding session (natural stopping point)
- After completing a feature or fixing a complex bug
- After a session with multiple corrections or discoveries
- When the user says "debrief", "capture learnings", or "what did we learn"

## Phase 1: Review the Session

Scan the conversation history for learnings. Look for these signals:

| Signal | What to capture |
|--------|----------------|
| Corrections ("no, use X instead") | The right approach and why the wrong one fails |
| Debugging breakthroughs | Root cause and fix, not just the symptom |
| Repeated mistakes | Pattern that keeps tripping us up |
| Architectural decisions | What was chosen and the reasoning |
| Surprising behavior | Gotchas, edge cases, unintuitive APIs |
| Process friction | Steps that were slow, confusing, or error-prone |
| Discovered conventions | Patterns in the codebase that weren't documented |

**Categorize each learning:**

| Category | Typical destination |
|----------|-------------------|
| **Mistake/Correction** | CLAUDE.md (universal) or .claude/rules/ (domain-specific) |
| **Architectural Decision** | CLAUDE.md or project docs (ARCHITECTURE.md, ADRs) |
| **Gotcha/Pitfall** | .claude/rules/ with path-scoping |
| **Pattern/Convention** | .claude/rules/ with path-scoping |
| **Process Improvement** | CLAUDE.md or CONTRIBUTING.md |
| **Debugging Insight** | .claude/rules/ topic file |

If the session had no meaningful learnings (simple task, everything went smoothly), say so and stop. Don't force learnings that aren't there.

## Phase 2: Audit Existing Documentation

Before proposing changes, check what already exists:

1. **Read CLAUDE.md** in the project root — understand its current structure and length
2. **Scan .claude/rules/** for existing rule files:
   ```
   Glob: .claude/rules/**/*.md
   ```
3. **Check for project docs** that might be relevant:
   ```
   Glob: {ARCHITECTURE,CONTRIBUTING,DEVELOPMENT}*.md
   Glob: docs/**/*.md
   ```
4. **Check CLAUDE.md for doc references** — Many repos document their docs structure in CLAUDE.md (e.g., `docs/API.md`, `docs/FRONTEND.md`). Scan for `@` imports and path references to discover project-specific documentation locations.
4. **Count CLAUDE.md lines** — track against the 300-line budget

For each learning, check:
- Is it already documented? → Skip
- Does it contradict existing docs? → Propose update to existing entry
- Is it genuinely new? → Propose addition

## Phase 3: Propose Updates

Present ALL proposed changes to the user in a single summary before writing anything.

### Format for Proposals

```markdown
## Session Debrief: Proposed Updates

### 1. CLAUDE.md (line count: current → projected)
- **Add**: "Never use `foo()` directly — always wrap with `safeFoo()` (see src/utils.ts:42)"
- **Update**: Change "Use npm" → "Use pnpm (npm causes lockfile conflicts)"

### 2. .claude/rules/api-conventions.md (new file)
- **Add**: Path-scoped rule for `src/api/**/*.ts`
- Content: "All API handlers must validate input with zod schemas before processing"

### 3. CONTRIBUTING.md
- **Add to Testing section**: "Run `npm run test:integration` separately — it requires a running database"

### 4. Skipped
- [Session-specific detail] — not generalizable
- [Already documented in .claude/rules/testing.md]
```

### CLAUDE.md Token Discipline

These rules are non-negotiable when proposing CLAUDE.md changes:

1. **Under 300 lines** — If already near limit, route to .claude/rules/ instead
2. **Earn its place** — Ask: "Would removing this cause Claude to make mistakes in future sessions?" If no, don't add it.
3. **One-liners only** — Brief, actionable. No paragraphs.
4. **No inline code blocks** — Use file:line references (e.g., `see src/config.ts:15-20`)
5. **Use @imports** for detailed docs — `@docs/api-patterns.md` not inline explanations
6. **Route domain knowledge to .claude/rules/** — Path-scope when possible:
   ```yaml
   ---
   paths:
     - "src/api/**/*.ts"
   ---
   ```
7. **Prefer updating over adding** — Extend an existing bullet point rather than adding a new one
8. **Never duplicate linter rules** — If ESLint/Prettier/Ruff enforces it, don't document it

### .claude/rules/ Best Practices

When creating or updating rule files:

- **One topic per file** — `api-conventions.md`, `testing.md`, `debugging.md`
- **Use path-scoping** when the rule only applies to certain files
- **Keep files focused** — 20-50 lines per file, not sprawling documents
- **Use clear filenames** — Future sessions need to find these by name

### Project Docs Updates

When updating CONTRIBUTING.md, ARCHITECTURE.md, docs/*.md, or other project docs:

- **Check for a docs/ folder** — Many repos have `docs/API.md`, `docs/FRONTEND.md`, `docs/ARCHITECTURE.md` etc. Route learnings to the most specific existing doc.
- **Follow CLAUDE.md references** — If CLAUDE.md uses `@docs/api-patterns.md` or similar imports, those are the authoritative locations for domain knowledge.
- **Match existing style** — Read the file first, follow its conventions
- **Add to existing sections** — Don't create new sections for single items
- **Keep it useful for humans too** — These docs serve the whole team, not just Claude

## Phase 4: Apply with Approval

Use AskUserQuestion to get approval:

```
Question: "Here are the proposed documentation updates from this session. Which should I apply?"
Header: "Updates"
multiSelect: true
Options:
  - Apply all: Apply all proposed changes
  - CLAUDE.md only: Only update CLAUDE.md
  - Rules only: Only update .claude/rules/ files
  - Let me pick: Show each change individually for approval
```

If user selects "Let me pick", present each change individually.

After applying changes:

1. Show a summary table of what was updated:

| File | Change | Lines |
|------|--------|-------|
| CLAUDE.md | Added gotcha about `safeFoo()` | +1 |
| .claude/rules/api-conventions.md | Created with zod validation rule | +8 |
| CONTRIBUTING.md | Added integration test note | +2 |

2. Report final CLAUDE.md line count and remaining budget

## What NOT to Capture

- **Session-specific context** — "We were debugging issue #42" (ephemeral)
- **Speculative conclusions** — "This might also affect X" (unverified)
- **Obvious things** — "Use git to commit" (Claude already knows)
- **Temporary workarounds** — Unless they're long-lived and affect the team
- **Personal preferences** — Route to `~/.claude/CLAUDE.md` or `CLAUDE.local.md` instead
- **Things the linter catches** — Trust the toolchain

## Edge Cases

### No CLAUDE.md exists
Create a minimal one with the project name and the first learning. Suggest the user flesh it out.

### CLAUDE.md is already at 300+ lines
Do NOT add to it. Instead:
- Route all learnings to .claude/rules/ files
- Suggest the user run a separate cleanup to trim CLAUDE.md (extract sections to .claude/rules/)

### .claude/rules/ directory doesn't exist
Create it with the first rule file. Explain the progressive disclosure pattern to the user.

### Contradictory information
If a learning contradicts existing documentation, flag it explicitly. Don't silently overwrite — the existing docs may be correct and the session's conclusion may be wrong.

### No learnings found
Say so honestly: "This session was straightforward — no new learnings to capture." Don't manufacture learnings to justify running the skill.

---

$ARGUMENTS

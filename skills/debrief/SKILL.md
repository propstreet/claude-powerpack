---
name: debrief
description: Capture session learnings and update project docs. Use when ending a session, after completing a feature, or when asked to "debrief", "capture learnings", "update project knowledge", or "what did we learn".
user-invocable: true
allowed-tools:
  - Bash(git:*)
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - AskUserQuestion
---

# Session Debrief

Capture learnings from the current session and persist them into project documentation. The goal is continuous improvement: never repeat the same mistakes, always build on what we learn.

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

Before proposing changes, read CLAUDE.md, scan .claude/rules/ for existing rule files, and check for project docs (ARCHITECTURE.md, CONTRIBUTING.md, docs/). Follow any `@` imports and path references in CLAUDE.md to discover documentation locations.

For each learning, check:
- Is it already documented? → Skip
- Does it contradict existing docs? → Propose update to existing entry
- Is it genuinely new? → Propose addition

Estimate CLAUDE.md line count and track against the 300-line budget.

## Phase 2.5: Prune Stale Entries

**Activates when BOTH conditions are true:**
- CLAUDE.md is above 250 lines
- Phase 1 found high-signal learnings that warrant CLAUDE.md addition

Scan CLAUDE.md for entries that no longer earn their place:

| Category | How to verify |
|----------|--------------|
| Duplicated by docs | Entry restates guidance in a docs/*.md file that CLAUDE.md already references |
| Enforced by toolchain | Linter, ast-grep, CI, or pre-commit hook already catches this (check config files) |
| Outdated | Convention no longer matches codebase (verify with grep/glob) |
| Session debris | Ephemeral context from a past session that was never cleaned up |

**Rules:**
- Require evidence for every removal — cite the doc, linter rule, or grep result that proves staleness
- When uncertain, keep the entry — false removals are worse than bloat
- Never prune architectural decisions or safety-critical rules without explicit user confirmation
- Present removals in Phase 3 alongside additions so the user sees the full picture

## Phase 3: Propose Updates

Present ALL proposed changes to the user in a single summary before writing anything.

### Format for Proposals

```markdown
## Session Debrief: Proposed Updates

### 1. CLAUDE.md (289 → 285 lines, net -4)
**Removals (pruned):**
- **Remove line 142**: "Use X pattern" — now documented in docs/SERVICES.md (referenced on line 12)
- **Remove line 87**: "Run prettier before committing" — enforced by pre-commit hook in .husky/pre-commit

**Additions:**
- **Add**: "IExceptionHandler gotcha: need both AddExceptionHandler() and UseExceptionHandler() (see src/Program.cs:42)"
- **Update**: Change "Use npm" → "Use pnpm (npm causes lockfile conflicts)"

### 2. .claude/rules/api-conventions.md (new file)
- **Add**: Path-scoped rule for `src/api/**/*.ts`
- Content: "All API handlers must validate input with zod schemas before processing"

### 3. Skipped
- [Session-specific detail] — not generalizable
- [Already documented in .claude/rules/testing.md]
```

### CLAUDE.md Token Discipline

These rules are non-negotiable when proposing CLAUDE.md changes:

1. **Under 300 lines** — If above 250, trigger Phase 2.5 pruning before routing to .claude/rules/
2. **Earn its place** — Ask: "Would removing this cause Claude to make mistakes in future sessions?" If no, don't add it.
3. **One-liners only** — Brief, actionable. No paragraphs.
4. **No inline code blocks** — Use file:line references (e.g., `see src/config.ts:15-20`)
5. **Use @imports** for detailed docs — `@docs/api-patterns.md` not inline explanations
6. **Route domain knowledge to .claude/rules/** — Path-scope when possible
7. **Prefer updating over adding** — Extend an existing bullet point rather than adding a new one
8. **Never duplicate linter rules** — If ESLint/Prettier/Ruff enforces it, don't document it

### .claude/rules/ Best Practices

- **One topic per file** — `api-conventions.md`, `testing.md`, `debugging.md`
- **Use path-scoping** when the rule only applies to certain files
- **Keep files focused** — 20-50 lines per file, not sprawling documents
- **Use clear filenames** — Future sessions need to find these by name

### Project Docs Updates

When updating CONTRIBUTING.md, ARCHITECTURE.md, docs/*.md:
- Check for a docs/ folder and route learnings to the most specific existing doc
- Follow CLAUDE.md `@` references to find authoritative locations
- Match existing style, add to existing sections
- Keep it useful for humans too — these docs serve the whole team

## Phase 4: Apply with Approval

Use AskUserQuestion to get approval:

```json
{
  "questions": [{
    "question": "Here are the proposed documentation updates from this session. Which should I apply?",
    "header": "Updates",
    "multiSelect": false,
    "options": [
      { "label": "Apply all", "description": "Apply all proposed changes listed above" },
      { "label": "CLAUDE.md only", "description": "Only update CLAUDE.md, skip other files" },
      { "label": "Rules only", "description": "Only update .claude/rules/ files" },
      { "label": "Let me pick", "description": "Show each change individually for approval" }
    ]
  }]
}
```

After applying, show a summary table of what was updated with file, change description, and line delta. Report final CLAUDE.md line count and remaining budget.

## What NOT to Capture

- **Session-specific context** — "We were debugging issue #42" (ephemeral)
- **Speculative conclusions** — "This might also affect X" (unverified)
- **Obvious things** — "Use git to commit" (Claude already knows)
- **Temporary workarounds** — Unless they're long-lived and affect the team
- **Personal preferences** — Route to `~/.claude/CLAUDE.md` or `CLAUDE.local.md` instead
- **Things the linter catches** — Trust the toolchain

## Edge Cases

- **No CLAUDE.md exists**: Create a minimal one with the project name and the first learning
- **CLAUDE.md above 250 lines**: Trigger Phase 2.5 pruning first. Only fall back to routing all learnings to .claude/rules/ if pruning cannot free sufficient space
- **.claude/rules/ doesn't exist**: Create it with the first rule file
- **Contradictory information**: Flag explicitly. Don't silently overwrite — the existing docs may be correct
- **No learnings found**: Say so honestly. Don't manufacture learnings to justify running the skill

---

$ARGUMENTS

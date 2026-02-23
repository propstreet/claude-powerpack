# Debrief Skill

Capture session learnings and persist them into project documentation. Run at the end of coding sessions to build a continuous learning loop.

## What It Does

1. **Reviews the session** for mistakes, corrections, discoveries, and decisions
2. **Audits existing docs** to avoid duplicates and find the right placement
3. **Proposes targeted updates** with progressive disclosure (pithy CLAUDE.md + detailed .claude/rules/)
4. **Applies with approval** — nothing is written without your say-so

## Example Prompts

```
"Debrief this session"
"Capture learnings from what we just did"
"Update project knowledge with what we learned"
"What did we learn? Save it."
```

## Where Learnings Go

| Type | Destination |
|------|-------------|
| Universal rules | CLAUDE.md (one-liners only) |
| Domain-specific knowledge | .claude/rules/*.md (path-scoped) |
| Architectural decisions | ARCHITECTURE.md or ADRs |
| Process changes | CONTRIBUTING.md |

## CLAUDE.md Discipline

The skill enforces token-efficient documentation:

- CLAUDE.md stays under 300 lines
- Each addition must pass: "Would removing this cause mistakes?"
- Detailed knowledge routes to .claude/rules/ with path-scoping
- Prefers @imports over inline content

## Allowed Tools

Bash (git read-only), Read, Edit, Write, Glob, Grep, AskUserQuestion

## Requirements

- Git repository (for context about recent changes)

## See Also

- [EXAMPLES.md](EXAMPLES.md) — Good vs bad debrief examples, routing decisions
- [SKILL.md](SKILL.md) — Full workflow loaded by Claude Code
